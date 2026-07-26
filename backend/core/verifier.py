from typing import Optional
from fastapi import APIRouter, Depends, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from core.verifier import split_into_claims, verify_claims
from core.auth import verify_api_key
from core.db import get_db, ensure_session
from core.models import Verification

router = APIRouter(dependencies=[Depends(verify_api_key)])

class VerifyRequest(BaseModel):
    answer: str
    context_chunks: list[str]

@router.post("/")
async def verify(body: VerifyRequest, x_session_id: Optional[str] = Header(default=None), db: AsyncSession = Depends(get_db)):
    claims = split_into_claims(body.answer)
    results = verify_claims(claims, body.context_chunks)
    supported = sum(1 for r in results if r["label"] == "supported")
    total = len(results)
    grounding_score = round(supported / total * 100, 1) if total > 0 else 0.0

    try:
        if x_session_id:
            await ensure_session(db, x_session_id)
        db.add(Verification(
            session_id=x_session_id,
            answer=body.answer,
            claims=results,
            total_claims=total,
            supported_count=supported,
            unsupported_count=total - supported,
            grounding_score=grounding_score,
        ))
        await db.commit()
    except Exception:
        await db.rollback()

    return JSONResponse({
        "claims": results,
        "total_claims": total,
        "supported_count": supported,
        "unsupported_count": total - supported,
        "grounding_score": grounding_score
    })