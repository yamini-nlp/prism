from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from core.verifier import split_into_claims, verify_claims

router = APIRouter()

class VerifyRequest(BaseModel):
    answer: str
    context_chunks: list[str]

@router.post("/")
async def verify(body: VerifyRequest):
    claims = split_into_claims(body.answer)
    results = verify_claims(claims, body.context_chunks)
    supported = sum(1 for r in results if r["label"] == "supported")
    total = len(results)
    return JSONResponse({
        "claims": results,
        "total_claims": total,
        "supported_count": supported,
        "unsupported_count": total - supported,
        "grounding_score": round(supported / total * 100, 1) if total > 0 else 0.0
    })