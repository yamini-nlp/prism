import base64
import binascii
import hashlib
import numpy as np
import re
import threading
import uuid
from datetime import datetime
from sqlalchemy import select, func, delete, or_, and_, exists, asc, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi

from core.models import Document, DocumentChunk
from core.db import ensure_session, validate_session_id
from core.cache import get_cache, set_cache, delete_cache_prefix
from core.metrics import record_cache_hit, record_cache_miss
from core.errors import NotFoundError, ValidationAppError

DOCUMENT_SORT_FIELDS = {
    "title": Document.title,
    "ingested_at": Document.ingested_at,
    "updated_at": Document.updated_at,
    "chunk_count": Document.chunk_count,
    "size_bytes": Document.size_bytes,
}

EMBED_DIM = 384
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
EMBED_CACHE_TTL_SECONDS = 86400

_EMBEDDING_MODEL = None
_RERANKER_MODEL = None
_model_lock = threading.Lock()


def _get_embedding_model():
    global _EMBEDDING_MODEL
    if _EMBEDDING_MODEL is None:
        with _model_lock:
            if _EMBEDDING_MODEL is None:
                _EMBEDDING_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    return _EMBEDDING_MODEL


def _get_reranker_model():
    global _RERANKER_MODEL
    if _RERANKER_MODEL is None:
        with _model_lock:
            if _RERANKER_MODEL is None:
                _RERANKER_MODEL = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _RERANKER_MODEL


def _validate_session_id(session_id: str) -> str:
    return validate_session_id(session_id)


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _build_bm25(chunks: list):
    if not chunks:
        return None
    corpus = [_tokenize(c.chunk) for c in chunks]
    return BM25Okapi(corpus)


def embed_chunks(texts: list[str]) -> np.ndarray:
    embeddings = _get_embedding_model().encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return embeddings.astype("float32")


def embed_query(query: str) -> np.ndarray:
    embedding = _get_embedding_model().encode([query], normalize_embeddings=True, show_progress_bar=False)
    return embedding.astype("float32")


def _normalize_for_cache(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip().lower()


def _embedding_cache_key(text: str) -> str:
    normalized = _normalize_for_cache(text)
    digest = hashlib.sha256(f"{EMBED_MODEL_NAME}:{normalized}".encode("utf-8")).hexdigest()
    return f"embedding:{digest}"


async def embed_chunks_cached(texts: list[str]) -> np.ndarray:
    if not texts:
        return np.zeros((0, EMBED_DIM), dtype="float32")

    keys = [_embedding_cache_key(t) for t in texts]
    vectors: dict[int, list] = {}

    for i, key in enumerate(keys):
        cached_value = await get_cache(key)
        if cached_value is not None:
            vectors[i] = cached_value
            record_cache_hit(key)
        else:
            record_cache_miss(key)

    missing_indices = [i for i in range(len(texts)) if i not in vectors]
    if missing_indices:
        missing_vecs = embed_chunks([texts[i] for i in missing_indices])
        for idx, vec in zip(missing_indices, missing_vecs):
            vec_list = vec.tolist()
            vectors[idx] = vec_list
            await set_cache(keys[idx], vec_list, EMBED_CACHE_TTL_SECONDS)

    return np.array([vectors[i] for i in range(len(texts))], dtype="float32")


async def invalidate_session_cache(session_id: str) -> None:
    await delete_cache_prefix(f"retrieve:{session_id}:")
    await delete_cache_prefix(f"generate:{session_id}:")


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> list[str]:
    text = re.sub(r'\s+', ' ', text).strip()
    words = text.split()
    result, start = [], 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = ' '.join(words[start:end]).strip()
        if len(chunk) > 30:
            result.append(chunk)
        start += chunk_size - overlap
    return result


def _serialize_document(doc: Document) -> dict:
    return {
        "id": str(doc.id),
        "title": doc.title,
        "source_type": doc.source_type,
        "chunk_count": doc.chunk_count,
        "chunk_start_index": doc.chunk_start_index,
        "ingested_at": doc.ingested_at.isoformat(),
        "status": doc.status,
        "size_bytes": doc.size_bytes,
        "updated_at": doc.updated_at.isoformat(),
    }


async def get_documents(db: AsyncSession, session_id: str) -> list[dict]:
    _validate_session_id(session_id)
    stmt = select(Document).where(Document.session_id == session_id).order_by(Document.ingested_at)
    result = await db.execute(stmt)
    documents = result.scalars().all()
    return [_serialize_document(doc) for doc in documents]


def _encode_cursor(offset: int) -> str:
    return base64.urlsafe_b64encode(str(offset).encode("utf-8")).decode("utf-8")


def _decode_cursor(cursor: str) -> int:
    try:
        decoded = base64.urlsafe_b64decode(cursor.encode("utf-8")).decode("utf-8")
        offset = int(decoded)
        if offset < 0:
            raise ValueError
        return offset
    except (ValueError, UnicodeDecodeError, binascii.Error):
        raise ValidationAppError("Invalid cursor", details={"cursor": cursor})


async def list_documents(
    db: AsyncSession,
    session_id: str,
    q: str | None = None,
    source_type: str | None = None,
    status: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort_by: str = "ingested_at",
    sort_dir: str = "asc",
    limit: int | None = None,
    offset: int = 0,
    cursor: str | None = None,
) -> dict:
    _validate_session_id(session_id)

    if sort_by not in DOCUMENT_SORT_FIELDS:
        raise ValidationAppError("Invalid sort_by field", details={"sort_by": sort_by, "allowed": list(DOCUMENT_SORT_FIELDS.keys())})
    if sort_dir not in ("asc", "desc"):
        raise ValidationAppError("Invalid sort_dir", details={"sort_dir": sort_dir, "allowed": ["asc", "desc"]})

    effective_offset = offset
    if cursor:
        effective_offset = _decode_cursor(cursor)

    filters = [Document.session_id == session_id]
    if source_type:
        filters.append(Document.source_type == source_type)
    if status:
        filters.append(Document.status == status)
    if date_from:
        filters.append(Document.ingested_at >= date_from)
    if date_to:
        filters.append(Document.ingested_at <= date_to)
    if q:
        like_pattern = f"%{q.strip()}%"
        chunk_match = exists(
            select(DocumentChunk.id).where(
                and_(DocumentChunk.document_id == Document.id, DocumentChunk.chunk.ilike(like_pattern))
            )
        )
        filters.append(or_(Document.title.ilike(like_pattern), chunk_match))

    base_stmt = select(Document).where(and_(*filters))
    count_stmt = select(func.count()).select_from(Document).where(and_(*filters))
    total = (await db.execute(count_stmt)).scalar() or 0

    order_col = DOCUMENT_SORT_FIELDS[sort_by]
    order_expr = asc(order_col) if sort_dir == "asc" else desc(order_col)
    stmt = base_stmt.order_by(order_expr, asc(Document.id)).offset(effective_offset)
    if limit is not None:
        stmt = stmt.limit(limit)

    result = await db.execute(stmt)
    documents = result.scalars().all()
    items = [_serialize_document(doc) for doc in documents]

    has_more = limit is not None and (effective_offset + len(items)) < total
    next_cursor = _encode_cursor(effective_offset + limit) if has_more and limit is not None else None

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": effective_offset,
        "has_more": has_more,
        "next_cursor": next_cursor,
    }


async def delete_document(db: AsyncSession, session_id: str, document_id: str) -> None:
    _validate_session_id(session_id)
    try:
        parsed_document_id = uuid.UUID(str(document_id))
    except (ValueError, AttributeError, TypeError):
        raise NotFoundError("Document not found", details={"document_id": document_id})
    stmt = select(Document).where(Document.session_id == session_id, Document.id == parsed_document_id)
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    if document is None:
        raise NotFoundError("Document not found", details={"document_id": document_id})
    await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document.id))
    await db.execute(delete(Document).where(Document.id == document.id))
    await db.commit()
    await invalidate_session_cache(session_id)


async def reset_storage(db: AsyncSession, session_id: str) -> None:
    _validate_session_id(session_id)
    await db.execute(delete(DocumentChunk).where(DocumentChunk.session_id == session_id))
    await db.execute(delete(Document).where(Document.session_id == session_id))
    await db.commit()
    await invalidate_session_cache(session_id)


async def embed_and_store(db: AsyncSession, text_chunks: list[str], source: str, session_id: str, source_type: str = "text", title: str = None) -> int:
    _validate_session_id(session_id)
    if not text_chunks:
        return 0
    await ensure_session(db, session_id)
    vecs = await embed_chunks_cached(text_chunks)
    count_stmt = select(func.count()).select_from(DocumentChunk).where(DocumentChunk.session_id == session_id)
    existing_count = (await db.execute(count_stmt)).scalar() or 0
    doc_title = title if title else (source if len(source) <= 60 else source[:60])
    total_size_bytes = sum(len(chunk.encode("utf-8")) for chunk in text_chunks)
    document = Document(
        session_id=session_id,
        title=doc_title,
        source=source,
        source_type=source_type,
        chunk_count=len(text_chunks),
        chunk_start_index=existing_count,
        status="ready",
        size_bytes=total_size_bytes,
    )
    db.add(document)
    await db.flush()
    for i, chunk in enumerate(text_chunks):
        db.add(DocumentChunk(
            document_id=document.id,
            session_id=session_id,
            source=source,
            chunk=chunk,
            chunk_index=i,
            embedding=vecs[i].tolist(),
        ))
    await db.commit()
    await invalidate_session_cache(session_id)
    return len(text_chunks)


async def _dense_search(db: AsyncSession, session_id: str, query: str, top_k: int):
    qvec = embed_query(query)[0].tolist()
    stmt = (
        select(DocumentChunk, DocumentChunk.embedding.cosine_distance(qvec).label("distance"))
        .where(DocumentChunk.session_id == session_id)
        .order_by(DocumentChunk.embedding.cosine_distance(qvec))
        .limit(top_k)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [(chunk, 1.0 - float(distance)) for chunk, distance in rows]


async def _fetch_all_chunks(db: AsyncSession, session_id: str):
    stmt = (
        select(DocumentChunk)
        .where(DocumentChunk.session_id == session_id)
        .order_by(DocumentChunk.created_at, DocumentChunk.chunk_index)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


def _bm25_search(chunks: list, query: str, top_k: int):
    bm25 = _build_bm25(chunks)
    if bm25 is None or not chunks:
        return []
    scores = bm25.get_scores(_tokenize(query))
    ranked_idx = np.argsort(scores)[::-1][:top_k]
    return [(chunks[idx].id, float(scores[idx])) for idx in ranked_idx if scores[idx] > 0]


def _reciprocal_rank_fusion(dense_ranked, bm25_ranked, k: int = 60):
    fused_scores: dict[uuid.UUID, float] = {}
    for rank, (chunk_id, _) in enumerate(dense_ranked):
        fused_scores[chunk_id] = fused_scores.get(chunk_id, 0.0) + 1.0 / (k + rank + 1)
    for rank, (chunk_id, _) in enumerate(bm25_ranked):
        fused_scores[chunk_id] = fused_scores.get(chunk_id, 0.0) + 1.0 / (k + rank + 1)
    return sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)


async def search(db: AsyncSession, query: str, session_id: str, top_k: int = 5, threshold: float = 0.45) -> list[dict]:
    _validate_session_id(session_id)
    candidates = await _dense_search(db, session_id, query, top_k)
    results = []
    for chunk, score in candidates:
        if score < threshold:
            continue
        results.append({
            "chunk": chunk.chunk,
            "source": chunk.source,
            "score": score,
            "chunk_index": chunk.chunk_index,
        })
    return results


async def hybrid_search(db: AsyncSession, query: str, session_id: str, top_k: int = 5) -> list[dict]:
    _validate_session_id(session_id)
    candidate_k = top_k * 3
    dense_candidates = await _dense_search(db, session_id, query, candidate_k)
    if not dense_candidates:
        return []
    all_chunks = await _fetch_all_chunks(db, session_id)
    chunk_by_id = {c.id: c for c in all_chunks}
    dense_ranked = [(chunk.id, score) for chunk, score in dense_candidates]
    bm25_ranked = _bm25_search(all_chunks, query, candidate_k)
    fused = _reciprocal_rank_fusion(dense_ranked, bm25_ranked)
    candidate_ids = [chunk_id for chunk_id, _ in fused[:candidate_k]]
    candidates = [chunk_by_id[cid] for cid in candidate_ids if cid in chunk_by_id]
    if not candidates:
        return []
    pairs = [[query, c.chunk] for c in candidates]
    rerank_scores = _get_reranker_model().predict(pairs)
    order = np.argsort(rerank_scores)[::-1][:top_k]
    results = []
    for pos in order:
        m = candidates[pos]
        results.append({
            "chunk": m.chunk,
            "source": m.source,
            "score": float(rerank_scores[pos]),
            "chunk_index": m.chunk_index,
        })
    return results
