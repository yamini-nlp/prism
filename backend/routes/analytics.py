from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from core.auth import get_current_user, get_session_id
from core.models import User, Document, Job, Generation, Verification
from core.db import get_db
from core.metrics import get_metrics, get_route_metrics

router = APIRouter()


def _bucket_by_date(timestamps):
    buckets: dict[str, int] = {}
    for ts in timestamps:
        key = ts.date().isoformat()
        buckets[key] = buckets.get(key, 0) + 1
    return [{"date": date, "count": count} for date, count in sorted(buckets.items())]


@router.get(
    "/summary",
    summary="Aggregate analytics summary",
    description="Aggregate document, generation, verification, background job, and request-latency metrics for the current session, computed from existing application and operational data.",
)
async def get_analytics_summary(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    session_id = get_session_id(current_user)

    document_timestamps = (
        await db.execute(select(Document.ingested_at).where(Document.session_id == session_id))
    ).scalars().all()

    generation_stats = (
        await db.execute(
            select(func.count(Generation.id), func.avg(Generation.confidence_score))
            .where(Generation.session_id == session_id)
        )
    ).one()
    generation_timestamps = (
        await db.execute(select(Generation.created_at).where(Generation.session_id == session_id))
    ).scalars().all()

    verification_stats = (
        await db.execute(
            select(func.count(Verification.id), func.avg(Verification.grounding_score))
            .where(Verification.session_id == session_id)
        )
    ).one()
    verification_timestamps = (
        await db.execute(select(Verification.created_at).where(Verification.session_id == session_id))
    ).scalars().all()

    active_jobs_count = (
        await db.execute(
            select(func.count(Job.id)).where(
                Job.session_id == session_id, Job.status.in_(["pending", "processing"])
            )
        )
    ).scalar() or 0

    route_metrics = get_route_metrics()
    overall_metrics = get_metrics()
    latency_by_route = [
        {
            "route": route,
            "request_count": data["request_count"],
            "error_count": data["error_count"],
            "p50_latency_ms": data["p50_latency_ms"],
            "p95_latency_ms": data["p95_latency_ms"],
            "p99_latency_ms": data["p99_latency_ms"],
        }
        for route, data in sorted(route_metrics.items())
    ]

    return {
        "documents": {
            "total": len(document_timestamps),
            "over_time": _bucket_by_date(document_timestamps),
        },
        "generations": {
            "total": generation_stats[0] or 0,
            "average_confidence": round(float(generation_stats[1]), 1) if generation_stats[1] is not None else None,
            "over_time": _bucket_by_date(generation_timestamps),
        },
        "verifications": {
            "total": verification_stats[0] or 0,
            "average_grounding_score": round(float(verification_stats[1]), 1) if verification_stats[1] is not None else None,
            "over_time": _bucket_by_date(verification_timestamps),
        },
        "active_jobs": active_jobs_count,
        "requests": {
            "total_requests": overall_metrics["total_requests"],
            "average_latency_ms": overall_metrics["average_latency_ms"],
            "by_route": latency_by_route,
        },
    }
