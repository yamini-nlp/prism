import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import Job
from core.db import ensure_session


async def create_job(db: AsyncSession, session_id: str = None) -> str:
    if session_id:
        await ensure_session(db, session_id)
    job = Job(id=uuid.uuid4(), session_id=session_id, status="pending", result=None, error=None)
    db.add(job)
    await db.commit()
    return str(job.id)


async def set_job_result(db: AsyncSession, job_id: str, result) -> None:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        return
    job = await db.get(Job, job_uuid)
    if job is not None:
        job.status = "complete"
        job.result = result
        await db.commit()


async def set_job_error(db: AsyncSession, job_id: str, error: str) -> None:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        return
    job = await db.get(Job, job_uuid)
    if job is not None:
        job.status = "failed"
        job.error = error
        await db.commit()


async def get_job(db: AsyncSession, job_id: str):
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        return None
    job = await db.get(Job, job_uuid)
    if job is None:
        return None
    return {"status": job.status, "result": job.result, "error": job.error}