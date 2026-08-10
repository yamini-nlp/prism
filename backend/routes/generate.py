import hashlib
import json
from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
from core.rag import stream_rag
from core.auth import get_current_user, get_session_id
from core.models import User
from core.limiter import limiter, GENERATE_RATE_LIMIT
from core.errors import ValidationAppError
from core.cache import get_cache, set_cache
from core.metrics import record_cache_hit, record_cache_miss
from core import schemas

router = APIRouter()

GENERATION_CACHE_TTL_SECONDS = 3600

def _generation_cache_key(session_id: str, query: str, top_k: int, model: str) -> str:
    digest = hashlib.sha256(f"{model}:{top_k}:{query.strip().lower()}".encode("utf-8")).hexdigest()
    return f"generate:{session_id}:{digest}"

def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

def _extract_done_payload(sse_event: str):
    if not sse_event.startswith("event: done\n"):
        return None
    for line in sse_event.split("\n"):
        if line.startswith("data: "):
            return json.loads(line[len("data: "):])
    return None

async def _cached_stream(cached_result: dict):
    yield _sse("retrieval", {
        "citations": cached_result.get("citations", []),
        "confidence_score": cached_result.get("confidence_score", 0.0),
    })
    yield _sse("token", {"token": cached_result.get("answer", "")})
    yield _sse("done", cached_result)

async def _live_stream(cache_key: str, query: str, session_id: str, top_k: int, model: str):
    final_payload = None
    async for event in stream_rag(query=query, session_id=session_id, top_k=top_k, model=model):
        payload = _extract_done_payload(event)
        if payload is not None:
            final_payload = payload
        yield event
    if final_payload is not None:
        await set_cache(cache_key, final_payload, GENERATION_CACHE_TTL_SECONDS)

@router.post(
    "/",
    summary="Generate a grounded answer",
    description="Stream a retrieval-augmented answer as server-sent events (retrieval, token, done), including citations and grounding verification.",
    responses={200: {"content": {"text/event-stream": {}}, "description": "Server-sent event stream"}},
)
@limiter.limit(GENERATE_RATE_LIMIT)
async def generate(request: Request, body: schemas.GenerateRequest, current_user: User = Depends(get_current_user)):
    if not body.query.strip():
        raise ValidationAppError("Query cannot be empty.")

    session_id = get_session_id(current_user)
    cache_key = _generation_cache_key(session_id, body.query, body.top_k, body.model)
    cached_result = await get_cache(cache_key)

    if cached_result is not None:
        record_cache_hit(cache_key)
        return StreamingResponse(_cached_stream(cached_result), media_type="text/event-stream")

    record_cache_miss(cache_key)
    return StreamingResponse(
        _live_stream(cache_key, body.query, session_id, body.top_k, body.model),
        media_type="text/event-stream",
    )
