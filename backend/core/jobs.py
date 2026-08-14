import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import Job
from core.db import ensure_session

TERMINAL_STATUSES = {"complete", "failed", "cancelled"}
STAGES = ["uploading", "parsing", "chunking", "embedding", "ready"]


async def create_job(db: AsyncSession, session_id: str = None) -> str:
    if session_id:
        await ensure_session(db, session_id)
    job = Job(id=uuid.uuid4(), session_id=session_id, status="pending", stage="uploading", result=None, error=None)
    db.add(job)
    await db.commit()
    return str(job.id)


async def set_job_stage(db: AsyncSession, job_id: str, stage: str) -> None:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        return
    job = await db.get(Job, job_uuid, populate_existing=True)
    if job is not None and job.status not in TERMINAL_STATUSES:
        job.stage = stage
        job.status = "processing"
        await db.commit()


async def set_job_result(db: AsyncSession, job_id: str, result) -> None:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        return
    job = await db.get(Job, job_uuid, populate_existing=True)
    if job is not None and job.status != "cancelled":
        job.status = "complete"
        job.stage = "ready"
        job.result = result
        await db.commit()


async def set_job_error(db: AsyncSession, job_id: str, error: str) -> None:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        return
    job = await db.get(Job, job_uuid, populate_existing=True)
    if job is not None and job.status != "cancelled":
        job.status = "failed"
        job.stage = "error"
        job.error = error
        await db.commit()


async def cancel_job(db: AsyncSession, job_id: str) -> Optional[dict]:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        return None
    job = await db.get(Job, job_uuid, populate_existing=True)
    if job is None:
        return None
    if job.status not in TERMINAL_STATUSES:
        job.status = "cancelled"
        job.stage = "cancelled"
        job.error = job.error or "Cancelled by user."
        await db.commit()
    return {"status": job.status, "stage": job.stage, "result": job.result, "error": job.error}


async def is_job_cancelled(db: AsyncSession, job_id: str) -> bool:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        return False
    job = await db.get(Job, job_uuid, populate_existing=True)
    return job is not None and job.status == "cancelled"


async def get_job(db: AsyncSession, job_id: str):
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        return None
    job = await db.get(Job, job_uuid, populate_existing=True)
    if job is None:
        return None
    return {"status": job.status, "stage": job.stage, "result": job.result, "error": job.error}


async def job_belongs_to_session(db: AsyncSession, job_id: str, session_id: str) -> Optional[bool]:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        return None
    job = await db.get(Job, job_uuid, populate_existing=True)
    if job is None:
        return None
    if job.session_id is None:
        return True
    return job.session_id == session_id