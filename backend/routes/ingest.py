from fastapi import APIRouter, Request, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
from bs4 import BeautifulSoup
from core.embedder import chunk_text, embed_and_store
from core.auth import get_current_user, get_session_id
from core.models import User
from core.limiter import limiter
from core.jobs import create_job, set_job_result, set_job_error, set_job_stage, is_job_cancelled
from core.db import get_db, AsyncSessionLocal
from core.errors import ValidationAppError
from core import schemas

router = APIRouter()

async def process_text(job_id: str, text: str, source: str, session_id: str):
    async with AsyncSessionLocal() as db:
        try:
            if await is_job_cancelled(db, job_id):
                return

            await set_job_stage(db, job_id, "parsing")
            title = text.strip()[:60]

            if await is_job_cancelled(db, job_id):
                return

            await set_job_stage(db, job_id, "chunking")
            chunks = chunk_text(text)

            if await is_job_cancelled(db, job_id):
                return

            await set_job_stage(db, job_id, "embedding")
            count = await embed_and_store(db, chunks, source=source, session_id=session_id, source_type="text", title=title)

            if await is_job_cancelled(db, job_id):
                return

            await set_job_result(db, job_id, {
                "status": "success",
                "source": source,
                "chunks_created": count,
                "characters": len(text),
                "preview": text[:500] + ("..." if len(text) > 500 else ""),
            })
        except Exception as e:
            await set_job_error(db, job_id, str(e))

async def process_url(job_id: str, url: str, session_id: str):
    async with AsyncSessionLocal() as db:
        try:
            if await is_job_cancelled(db, job_id):
                return

            await set_job_stage(db, job_id, "parsing")

            with httpx.Client(timeout=15.0, follow_redirects=True) as client:
                response = client.get(url, headers={"User-Agent": "Mozilla/5.0"})
                response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                tag.decompose()
            text = soup.get_text(separator="\n", strip=True)

            if await is_job_cancelled(db, job_id):
                return

            if len(text.strip()) < 100:
                await set_job_error(db, job_id, "Could not extract sufficient text from URL.")
                return

            await set_job_stage(db, job_id, "chunking")
            chunks = chunk_text(text)

            if await is_job_cancelled(db, job_id):
                return

            await set_job_stage(db, job_id, "embedding")
            count = await embed_and_store(db, chunks, source=url, session_id=session_id, source_type="url", title=url[:60])

            if await is_job_cancelled(db, job_id):
                return

            await set_job_result(db, job_id, {
                "status": "success",
                "source": url,
                "chunks_created": count,
                "characters_extracted": len(text),
                "preview": text[:500] + ("..." if len(text) > 500 else ""),
            })
        except Exception as e:
            await set_job_error(db, job_id, str(e))

@router.post(
    "/text",
    response_model=schemas.JobAcceptedResponse,
    status_code=202,
    summary="Ingest raw text",
    description="Accept raw text and process it into embedded chunks in the background. Returns a job id for status polling.",
)
@limiter.limit("10/minute")
async def ingest_text(request: Request, background_tasks: BackgroundTasks, body: schemas.TextIngestRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    session_id = get_session_id(current_user)
    if len(body.text.strip()) < 50:
        raise ValidationAppError("Text is too short to ingest.")
    job_id = await create_job(db, session_id=session_id)
    background_tasks.add_task(process_text, job_id, body.text, body.source, session_id)
    return schemas.JobAcceptedResponse(job_id=job_id)

@router.post(
    "/url",
    response_model=schemas.JobAcceptedResponse,
    status_code=202,
    summary="Ingest a URL",
    description="Fetch a URL, extract its main text content, and process it into embedded chunks in the background. Returns a job id for status polling.",
)
@limiter.limit("10/minute")
async def ingest_url(request: Request, background_tasks: BackgroundTasks, body: schemas.URLIngestRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    session_id = get_session_id(current_user)
    job_id = await create_job(db, session_id=session_id)
    background_tasks.add_task(process_url, job_id, body.url, session_id)
    return schemas.JobAcceptedResponse(job_id=job_id)
