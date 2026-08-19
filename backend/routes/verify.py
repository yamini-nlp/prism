from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.verifier import split_into_claims, verify_claims
from core.auth import get_current_user, get_session_id
from core.models import User, Verification
from core.db import get_db, ensure_session
from core import schemas

router = APIRouter()

@router.post(
    "/",
    response_model=schemas.VerifyResponse,
    summary="Verify claim grounding",
    description="Split a generated answer into claims and verify each claim against the provided context chunks, returning a grounding score.",
)
async def verify(body: schemas.VerifyRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    claims = split_into_claims(body.answer)
    results = verify_claims(claims, body.context_chunks)
    supported = sum(1 for r in results if r["label"] == "supported")
    uncertain = sum(1 for r in results if r["label"] == "uncertain")
    total = len(results)
    unsupported = total - supported - uncertain
    grounding_score = round(supported / total * 100, 1) if total > 0 else 0.0

    session_id = get_session_id(current_user)
    try:
        await ensure_session(db, session_id)
        db.add(Verification(
            session_id=session_id,
            answer=body.answer,
            claims=results,
            total_claims=total,
            supported_count=supported,
            unsupported_count=unsupported,
            grounding_score=grounding_score,
        ))
        await db.commit()
    except Exception:
        await db.rollback()

    return schemas.VerifyResponse(
        claims=[schemas.ClaimResult(**r) for r in results],
        total_claims=total,
        supported_count=supported,
        unsupported_count=unsupported,
        uncertain_count=uncertain,
        grounding_score=grounding_score,
    )
