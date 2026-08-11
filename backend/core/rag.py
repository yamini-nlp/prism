import json
from typing import cast, Iterable
from core.embedder import hybrid_search
from core.verifier import split_into_claims, verify_claims
from core.db import AsyncSessionLocal, ensure_session
from core.models import Generation
from core.config import settings
from groq import Groq
from groq.types.chat import ChatCompletionMessageParam

client = Groq(api_key=settings.groq_api_key)

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
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-8b-8192",
}
DEFAULT_MODEL = "llama-3.3-70b-versatile"


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


async def stream_rag(query: str, session_id: str, top_k: int = 5, model: str = DEFAULT_MODEL):
    if model not in VALID_MODELS:
        model = DEFAULT_MODEL

    async with AsyncSessionLocal() as db:
        retrieved = await hybrid_search(db, query, session_id, top_k=top_k)

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

        stream = client.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
            temperature=0.1,
            max_tokens=1024,
            stream=True,
        )

        answer_parts = []
        for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            token = getattr(delta, "content", None)
            if token:
                answer_parts.append(token)
                yield _sse("token", {"token": token})

        answer = "".join(answer_parts)

        claims = split_into_claims(answer)
        grounding = verify_claims(claims, chunk_texts)
        hallucination_flags = [g["claim"] for g in grounding if g["label"] == "unsupported"]

        try:
            await ensure_session(db, session_id)
            db.add(Generation(
                session_id=session_id,
                query=query,
                answer=answer,
                model=model,
                confidence_score=confidence,
                citations=citations,
                hallucination_flags=hallucination_flags,
            ))
            await db.commit()
        except Exception:
            await db.rollback()

        yield _sse("done", {
            "answer": answer,
            "citations": citations,
            "confidence_score": confidence,
            "hallucination_flags": hallucination_flags,
            "grounding": grounding,
        })
