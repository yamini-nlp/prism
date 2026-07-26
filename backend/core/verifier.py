import re

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")
_WORD_RE = re.compile(r"[A-Za-z0-9]+")


def split_into_claims(answer: str) -> list[str]:
    text = (answer or "").strip()
    if not text:
        return []
    raw_sentences = _SENTENCE_SPLIT_RE.split(text)
    return [s.strip() for s in raw_sentences if s.strip()]


def _tokenize(text: str) -> set[str]:
    return {w.lower() for w in _WORD_RE.findall(text)}


def _is_supported(claim: str, context_chunks: list[str]) -> bool:
    claim_tokens = _tokenize(claim)
    if not claim_tokens:
        return False
    significant_tokens = {t for t in claim_tokens if len(t) > 3}
    if not significant_tokens:
        significant_tokens = claim_tokens
    for chunk in context_chunks:
        chunk_tokens = _tokenize(chunk)
        overlap = significant_tokens & chunk_tokens
        if len(overlap) / len(significant_tokens) >= 0.5:
            return True
    return False


def verify_claims(claims: list[str], context_chunks: list[str]) -> list[dict]:
    results = []
    for claim in claims:
        supported = bool(context_chunks) and _is_supported(claim, context_chunks)
        results.append({"claim": claim, "label": "supported" if supported else "unsupported"})
    return results