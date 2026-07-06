from fastapi import APIRouter, HTTPException, Request, Depends, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from core.rag import stream_rag
from core.auth import verify_api_key
from core.limiter import limiter

router = APIRouter(dependencies=[Depends(verify_api_key)])

class GenerateRequest(BaseModel):
    query: str
    top_k: int = 5
    model: str = "llama-3.3-70b-versatile"

@router.post("/")
@limiter.limit("20/minute")
async def generate(request: Request, body: GenerateRequest, x_session_id: str = Header(...)):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    return StreamingResponse(
        stream_rag(
            query=body.query,
            session_id=x_session_id,
            top_k=body.top_k,
            model=body.model,
        ),
        media_type="text/event-stream",
    )