import asyncio
import json
import logging
from typing import cast, Iterable
from core.embedder import hybrid_search
from core.verifier import split_into_claims, verify_claims
from core.db import AsyncSessionLocal, ensure_session
from core.models import Generation, Verification
from core.config import settings
import groq
from groq import AsyncGroq
from groq.types.chat import ChatCompletionMessageParam

logger = logging.getLogger("prism")

client = AsyncGroq(api_key=settings.groq_api_key, timeout=45.0, max_retries=1)

RETRIEVAL_TIMEOUT_SECONDS = 30.0
FIRST_TOKEN_TIMEOUT_SECONDS = 30.0
STREAM_IDLE_TIMEOUT_SECONDS = 20.0
POST_PROCESS_TIMEOUT_SECONDS = 15.0

SYSTEM_PROMPT = """You are Prism, a research intelligence assistant. Your job is to answer questions strictly based on the provided context chunks from research documents.

Rules:
- Only use information present in the provided context.
- If the context does not contain enough information to answer, say so clearly.
- Always be precise and academic in tone.
- Do not hallucinate facts, numbers, or claims not present in the context.
- Structure your answer clearly with numbered points when listing multiple findings.
- Do not use markdown asterisks for bold — write plainly and clearly instead.
- Every context chunk you are given is labeled with a source number, e.g. "[Source 2: ...]". Whenever you state a fact drawn from a specific source, immediately append a bracketed citation marker with that source number, e.g. [2]. Use multiple markers back to back like [1][3] when a statement draws on more than one source.
- Only use marker numbers that correspond to a source actually provided in the context. Never invent a marker number beyond the number of sources given.
"""

VALID_MODELS = {
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
}
DEFAULT_MODEL = "openai/gpt-oss-120b"


def build_context(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks):
        parts.append(
            f"[Source {i+1}: {chunk['source']} | Similarity: {chunk['score']:.2f}]\n{chunk['chunk']}"
        )
    return "\n\n---\n\n".join(parts)


def compute_confidence(chunks: list[dict]) -> float:
    if not chunks:
        return 0.0
    avg_score = sum(c["score"] for c in chunks) / len(chunks)
    return round(min(avg_score * 100, 100), 1)


def build_citations(chunks: list[dict]) -> list[dict]:
    return [
        {
            "id": f"c{i+1}",
            "text": chunk["chunk"][:280] + ("..." if len(chunk["chunk"]) > 280 else ""),
            "source": chunk["source"],
            "score": chunk["score"],
            "chunk_index": chunk["chunk_index"],
        }
        for i, chunk in enumerate(chunks)
    ]


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _error_payload(message: str, code: str) -> dict:
    return {
        "answer": message,
        "citations": [],
        "confidence_score": 0.0,
        "hallucination_flags": [],
        "grounding": [],
        "error": {"code": code, "message": message},
    }


async def stream_rag(query: str, session_id: str, top_k: int = 5, model: str = DEFAULT_MODEL):
    if model not in VALID_MODELS:
        model = DEFAULT_MODEL

    try:
        async with AsyncSessionLocal() as db:
            retrieved = await asyncio.wait_for(
                hybrid_search(db, query, session_id, top_k=top_k),
                timeout=RETRIEVAL_TIMEOUT_SECONDS,
            )
    except asyncio.TimeoutError:
        logger.error("hybrid_search timed out", extra={"session_id": session_id})
        message = "Retrieval is taking too long right now. Please try again in a moment."
        yield _sse("retrieval", {"citations": [], "confidence_score": 0.0})
        yield _sse("error", {"message": message, "code": "retrieval_timeout"})
        yield _sse("done", _error_payload(message, "retrieval_timeout"))
        return
    except Exception:
        logger.exception("hybrid_search failed", extra={"session_id": session_id})
        message = "Something went wrong while searching your documents. Please try again."
        yield _sse("retrieval", {"citations": [], "confidence_score": 0.0})
        yield _sse("error", {"message": message, "code": "retrieval_failed"})
        yield _sse("done", _error_payload(message, "retrieval_failed"))
        return

    if not retrieved:
        yield _sse("retrieval", {"citations": [], "confidence_score": 0.0})
        message = "No relevant documents found. Please ingest some research papers first."
        yield _sse("token", {"token": message})
        yield _sse("done", {
            "answer": message,
            "citations": [],
            "confidence_score": 0.0,
            "hallucination_flags": [],
            "grounding": [],
        })
        return

    context = build_context(retrieved)
    confidence = compute_confidence(retrieved)
    citations = build_citations(retrieved)
    chunk_texts = [c["chunk"] for c in retrieved]

    yield _sse("retrieval", {"citations": citations, "confidence_score": confidence})

    messages = [
        {
            "role": "user",
            "content": (
                f"Context:\n{context}\n\n"
                f"Question: {query}\n\n"
                f"Answer based strictly on the context above. "
                f"Do not use ** for bold text — write in plain prose. "
                f"Cite the source number in brackets, e.g. [1], right after each fact you draw from it."
            ),
        }
    ]

    answer_parts: list[str] = []
    try:
        stream = await asyncio.wait_for(
            client.chat.completions.create(
                model=model,
                messages=cast(Iterable[ChatCompletionMessageParam], [{"role": "system", "content": SYSTEM_PROMPT}] + messages),
                temperature=0.1,
                max_tokens=1024,
                stream=True,
            ),
            timeout=FIRST_TOKEN_TIMEOUT_SECONDS,
        )

        stream_iter = stream.__aiter__()
        while True:
            try:
                chunk = await asyncio.wait_for(stream_iter.__anext__(), timeout=STREAM_IDLE_TIMEOUT_SECONDS)
            except StopAsyncIteration:
                break
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            token = getattr(delta, "content", None)
            if token:
                answer_parts.append(token)
                yield _sse("token", {"token": token})
    except asyncio.TimeoutError:
        logger.error("groq stream timed out", extra={"session_id": session_id})
        message = "The model took too long to respond. Please try again."
        if answer_parts:
            answer = "".join(answer_parts)
            yield _sse("done", {
                "answer": answer,
                "citations": citations,
                "confidence_score": confidence,
                "hallucination_flags": [],
                "grounding": [],
            })
        else:
            yield _sse("error", {"message": message, "code": "generation_timeout"})
            yield _sse("done", _error_payload(message, "generation_timeout"))
        return
    except groq.AuthenticationError as exc:
        logger.error(
            "groq authentication failed",
            extra={"session_id": session_id, "status_code": exc.status_code, "body": exc.body},
        )
        message = "The model failed to generate a response. Please try again."
        yield _sse("error", {"message": message, "code": "generation_failed"})
        yield _sse("done", _error_payload(message, "generation_failed"))
        return
    except groq.RateLimitError as exc:
        logger.error(
            "groq rate limit exceeded",
            extra={"session_id": session_id, "status_code": exc.status_code, "body": exc.body},
        )
        message = "The model is receiving too many requests right now. Please try again shortly."
        yield _sse("error", {"message": message, "code": "generation_rate_limited"})
        yield _sse("done", _error_payload(message, "generation_rate_limited"))
        return
    except groq.NotFoundError as exc:
        logger.error(
            "groq model not found",
            extra={"session_id": session_id, "model": model, "status_code": exc.status_code, "body": exc.body},
        )
        message = "The model failed to generate a response. Please try again."
        yield _sse("error", {"message": message, "code": "generation_failed"})
        yield _sse("done", _error_payload(message, "generation_failed"))
        return
    except groq.APIStatusError as exc:
        logger.error(
            "groq api returned an error status",
            extra={"session_id": session_id, "status_code": exc.status_code, "body": exc.body},
        )
        message = "The model failed to generate a response. Please try again."
        yield _sse("error", {"message": message, "code": "generation_failed"})
        yield _sse("done", _error_payload(message, "generation_failed"))
        return
    except groq.APIConnectionError as exc:
        logger.error(
            "could not reach groq api",
            extra={"session_id": session_id, "error": str(exc)},
        )
        message = "The model failed to generate a response. Please try again."
        yield _sse("error", {"message": message, "code": "generation_failed"})
        yield _sse("done", _error_payload(message, "generation_failed"))
        return
    except Exception:
        logger.exception("groq generation failed", extra={"session_id": session_id})
        message = "The model failed to generate a response. Please try again."
        yield _sse("error", {"message": message, "code": "generation_failed"})
        yield _sse("done", _error_payload(message, "generation_failed"))
        return

    answer = "".join(answer_parts)

    try:
        claims = split_into_claims(answer)
        grounding = await asyncio.wait_for(
            asyncio.to_thread(verify_claims, claims, chunk_texts),
            timeout=POST_PROCESS_TIMEOUT_SECONDS,
        )
    except Exception:
        logger.exception("claim verification failed", extra={"session_id": session_id})
        grounding = []

    hallucination_flags = [g["claim"] for g in grounding if g["label"] == "unsupported"]

    supported_count = sum(1 for g in grounding if g["label"] == "supported")
    uncertain_count = sum(1 for g in grounding if g["label"] == "uncertain")
    total_claims = len(grounding)
    unsupported_count = total_claims - supported_count - uncertain_count
    grounding_score = round(supported_count / total_claims * 100, 1) if total_claims > 0 else 0.0

    try:
        async with AsyncSessionLocal() as db:
            await asyncio.wait_for(ensure_session(db, session_id), timeout=POST_PROCESS_TIMEOUT_SECONDS)
            generation = Generation(
                session_id=session_id,
                query=query,
                answer=answer,
                model=model,
                confidence_score=confidence,
                citations=citations,
                hallucination_flags=hallucination_flags,
            )
            db.add(generation)
            await db.flush()
            db.add(Verification(
                generation_id=generation.id,
                session_id=session_id,
                answer=answer,
                claims=grounding,
                total_claims=total_claims,
                supported_count=supported_count,
                unsupported_count=unsupported_count,
                grounding_score=grounding_score,
            ))
            await db.commit()
    except Exception:
        logger.exception("failed to persist generation/verification", extra={"session_id": session_id})

    yield _sse("done", {
        "answer": answer,
        "citations": citations,
        "confidence_score": confidence,
        "hallucination_flags": hallucination_flags,
        "grounding": grounding,
    })
