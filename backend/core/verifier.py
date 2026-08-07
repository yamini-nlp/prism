import re

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")
_WORD_RE = re.compile(r"[A-Za-z0-9]+")

SUPPORTED_THRESHOLD = 0.5
UNCERTAIN_THRESHOLD = 0.25


def split_into_claims(answer: str) -> list[str]:
    text = (answer or "").strip()
    if not text:
        return []
    raw_sentences = _SENTENCE_SPLIT_RE.split(text)
    return [s.strip() for s in raw_sentences if s.strip()]


def _tokenize(text: str) -> set[str]:
    return {w.lower() for w in _WORD_RE.findall(text)}


def _split_sentences(text: str) -> list[str]:
    raw = _SENTENCE_SPLIT_RE.split((text or "").strip())
    return [s.strip() for s in raw if s.strip()]


def _significant_tokens(claim_tokens: set[str]) -> set[str]:
    significant = {t for t in claim_tokens if len(t) > 3}
    return significant if significant else claim_tokens


def _best_match(claim: str, context_chunks: list[str]) -> tuple[int, float]:
    claim_tokens = _tokenize(claim)
    significant_tokens = _significant_tokens(claim_tokens)
    if not significant_tokens:
        return -1, 0.0

    best_index = -1
    best_ratio = 0.0
    for i, chunk in enumerate(context_chunks):
        chunk_tokens = _tokenize(chunk)
        overlap = significant_tokens & chunk_tokens
        ratio = len(overlap) / len(significant_tokens)
        if ratio > best_ratio:
            best_ratio = ratio
            best_index = i
    return best_index, best_ratio


def _extract_evidence_span(claim: str, chunk_text: str) -> str | None:
    claim_tokens = _tokenize(claim)
    significant_tokens = _significant_tokens(claim_tokens)
    if not significant_tokens:
        return None

    sentences = _split_sentences(chunk_text)
    if not sentences:
        trimmed = chunk_text.strip()
        if not trimmed:
            return None
        return trimmed[:240] + ("..." if len(trimmed) > 240 else "")

    best_sentence = None
    best_overlap = -1
    for sentence in sentences:
        sentence_tokens = _tokenize(sentence)
        overlap = len(significant_tokens & sentence_tokens)
        if overlap > best_overlap:
            best_overlap = overlap
            best_sentence = sentence

    if not best_sentence:
        return None
    if len(best_sentence) > 240:
        return best_sentence[:240].strip() + "..."
    return best_sentence


def _is_supported(claim: str, context_chunks: list[str]) -> bool:
    _, ratio = _best_match(claim, context_chunks)
    return ratio >= SUPPORTED_THRESHOLD


def verify_claims(claims: list[str], context_chunks: list[str]) -> list[dict]:
    results = []
    for claim in claims:
        if not context_chunks:
            results.append({
                "claim": claim,
                "label": "unsupported",
                "confidence": 0.0,
                "supporting_chunk": None,
                "source_chunk_index": None,
            })
            continue

        best_index, ratio = _best_match(claim, context_chunks)

        if ratio >= SUPPORTED_THRESHOLD:
            label = "supported"
        elif ratio >= UNCERTAIN_THRESHOLD:
            label = "uncertain"
        else:
            label = "unsupported"

        evidence = None
        if best_index >= 0 and label in ("supported", "uncertain"):
            evidence = _extract_evidence_span(claim, context_chunks[best_index])

        results.append({
            "claim": claim,
            "label": label,
            "confidence": round(min(ratio, 1.0) * 100, 1),
            "supporting_chunk": evidence,
            "source_chunk_index": best_index if best_index >= 0 else None,
        })
    return results