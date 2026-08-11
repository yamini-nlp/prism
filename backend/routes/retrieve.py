import hashlib
from fastapi import APIRouter, Query, Request, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from core.embedder import hybrid_search
from core.models import DocumentChunk
from core.auth import get_current_user, get_session_id
from core.models import User
from core.limiter import limiter
from core.db import get_db
from core.cache import get_cache, set_cache
from core.metrics import record_cache_hit, record_cache_miss
from core import schemas

router = APIRouter()

RETRIEVAL_CACHE_TTL_SECONDS = 900

async def _document_set_fingerprint(db: AsyncSession, session_id: str) -> str:
    stmt = select(func.count(), func.max(DocumentChunk.created_at)).where(DocumentChunk.session_id == session_id)
    result = await db.execute(stmt)
    count, latest = result.one()
    return f"{count}:{latest.isoformat() if latest else 'none'}"

def _retrieve_cache_key(session_id: str, query: str, top_k: int, fingerprint: str) -> str:
    digest = hashlib.sha256(f"{query.strip().lower()}:{top_k}:{fingerprint}".encode("utf-8")).hexdigest()
    return f"retrieve:{session_id}:{digest}"

@router.get(
    "/",
    response_model=schemas.RetrieveResponse,
    summary="Retrieve relevant chunks",
    description="Run hybrid dense and lexical retrieval with cross-encoder reranking over the current session's ingested chunks.",
)
@limiter.limit("60/minute")
async def retrieve(
    request: Request,
    query: str = Query(..., description="Search query"),
    top_k: int = Query(5, ge=1, le=20, description="Number of chunks to retrieve"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session_id = get_session_id(current_user)

    fingerprint = await _document_set_fingerprint(db, session_id)
    cache_key = _retrieve_cache_key(session_id, query, top_k, fingerprint)
    cached_response = await get_cache(cache_key)
    if cached_response is not None:
        record_cache_hit(cache_key)
        return schemas.RetrieveResponse(**cached_response)

record_cache_miss(cache_key)
    results = await hybrid_search(db, query, session_id, top_k=top_k)

    response_body = {
        "query": query,
        "top_k": top_k,
        "results": results,
        "count": len(results),
    }
    await set_cache(cache_key, response_body, RETRIEVAL_CACHE_TTL_SECONDS)

    return schemas.RetrieveResponse(
        query=query,
        top_k=top_k,
        results=[schemas.RetrievedChunk(**r) for r in results],
        count=len(results),
    )
