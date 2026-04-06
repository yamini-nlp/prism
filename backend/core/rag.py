from core.embedder import search
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are Prism, a research intelligence assistant. Your job is to answer questions strictly based on the provided context chunks from research documents.

Rules:
- Only use information present in the provided context.
- If the context does not contain enough information to answer, say so clearly.
- Always be precise and academic in tone.
- Do not hallucinate facts, numbers, or claims not present in the context.
- Structure your answer clearly with numbered points when listing multiple findings.
- Do not use markdown asterisks for bold — write plainly and clearly instead.
"""
VALID_MODELS = {
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-8b-8192",
}
DEFAULT_MODEL = "llama-3.3-70b-versatile"
MIN_SCORE_THRESHOLD = 0.45


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


def run_rag(query: str, top_k: int = 5, model: str = DEFAULT_MODEL) -> dict:
    if model not in VALID_MODELS:
        model = DEFAULT_MODEL

    retrieved_raw = search(query, top_k=top_k)
    retrieved = [c for c in retrieved_raw if c.get("score", 0) >= MIN_SCORE_THRESHOLD]
    if not retrieved and retrieved_raw:
        retrieved = retrieved_raw[:1]

    if not retrieved:
        return {
            "answer": "No relevant documents found. Please ingest some research papers first.",
            "citations": [],
            "retrieved_chunks": [],
            "confidence_score": 0.0,
            "hallucination_flags": [],
        }

    context = build_context(retrieved)
    confidence = compute_confidence(retrieved)

    messages = [
        {
            "role": "user",
            "content": (
                f"Context:\n{context}\n\n"
                f"Question: {query}\n\n"
                f"Answer based strictly on the context above. "
                f"Do not use ** for bold text — write in plain prose."
            ),
        }
    ]

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        temperature=0.1,
        max_tokens=1024,
    )

    answer = response.choices[0].message.content

    citations = [
        {
            "id": f"c{i+1}",
            "text": chunk["chunk"][:280] + ("..." if len(chunk["chunk"]) > 280 else ""),
            "source": chunk["source"],
            "score": chunk["score"],
            "chunk_index": chunk["chunk_index"],
        }
        for i, chunk in enumerate(retrieved)
    ]

    return {
        "answer": answer,
        "citations": citations,
        "retrieved_chunks": retrieved,
        "confidence_score": confidence,
        "hallucination_flags": [],
    }