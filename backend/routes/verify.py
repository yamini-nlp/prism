from fastapi import APIRouter, Depends
from core.verifier import split_into_claims, verify_claims
from core.auth import get_current_user
from core.models import User
from core import schemas

router = APIRouter()

@router.post(
    "/",
    response_model=schemas.VerifyResponse,
    summary="Verify claim grounding",
    description="Split a generated answer into claims and verify each claim against the provided context chunks, returning a grounding score.",
)
async def verify(body: schemas.VerifyRequest, current_user: User = Depends(get_current_user)):
    claims = split_into_claims(body.answer)
    results = verify_claims(claims, body.context_chunks)
    supported = sum(1 for r in results if r["label"] == "supported")
    total = len(results)
    return schemas.VerifyResponse(
        claims=results,
        total_claims=total,
        supported_count=supported,
        unsupported_count=total - supported,
        grounding_score=round(supported / total * 100, 1) if total > 0 else 0.0,
    )