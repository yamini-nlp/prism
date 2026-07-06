import re
from sentence_transformers import CrossEncoder

NLI_MODEL = CrossEncoder("cross-encoder/nli-deberta-v3-small")

def split_into_claims(answer: str) -> list[str]:
    sentences = re.split(r'(?<=[.!?])\s+', answer.strip())
    return [s.strip() for s in sentences if len(s.strip()) > 20]

def verify_claims(claims: list[str], context_chunks: list[str]) -> list[dict]:
    if not claims:
        return []
    if not context_chunks:
        return [
            {"claim": claim, "label": "unsupported", "confidence": 0.0, "supporting_chunk": None}
            for claim in claims
        ]

    pairs = [[chunk, claim] for claim in claims for chunk in context_chunks]
    scores = NLI_MODEL.predict(pairs)

    num_chunks = len(context_chunks)
    results = []
    for i, claim in enumerate(claims):
        best_label = "unsupported"
        best_score = 0.0
        best_chunk = None
        for j, chunk in enumerate(context_chunks):
            contradiction_score, entailment_score, neutral_score = scores[i * num_chunks + j]
            if entailment_score > 0.5 and entailment_score > best_score:
                best_score = float(entailment_score)
                best_label = "supported"
                best_chunk = chunk
        results.append({
            "claim": claim,
            "label": best_label,
            "confidence": round(best_score * 100, 1),
            "supporting_chunk": best_chunk if best_label == "supported" else None
        })
    return results