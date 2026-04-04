from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from core.rag import run_rag

router = APIRouter()

class GenerateRequest(BaseModel):
    query: str
    top_k: int = 5
    model: str = "llama-3.3-70b-versatile"
    verify: bool = False

@router.post("/")
async def generate(body: GenerateRequest):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    result = run_rag(
        query=body.query,
        top_k=body.top_k,
        model=body.model,
    )

    return JSONResponse(result)