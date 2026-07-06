from fastapi import APIRouter, HTTPException, Request, Depends, Header, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from core.embedder import chunk_text, embed_and_store
from core.auth import verify_api_key
from core.limiter import limiter
from core.jobs import create_job, set_job_result, set_job_error

router = APIRouter(dependencies=[Depends(verify_api_key)])

class TextIngest(BaseModel):
    text: str
    source: str = "Manual Input"

class URLIngest(BaseModel):
    url: str

def process_text(job_id: str, text: str, source: str, session_id: str):
    try:
        chunks = chunk_text(text)
        title = text.strip()[:60]
        count = embed_and_store(chunks, source=source, session_id=session_id, source_type="text", title=title)
        set_job_result(job_id, {
            "status": "success",
            "source": source,
            "chunks_created": count,
            "characters": len(text),
        })
    except Exception as e:
        set_job_error(job_id, str(e))

def process_url(job_id: str, url: str, session_id: str):
    try:
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            response = client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        if len(text.strip()) < 100:
            set_job_error(job_id, "Could not extract sufficient text from URL.")
            return
        chunks = chunk_text(text)
        count = embed_and_store(chunks, source=url, session_id=session_id, source_type="url", title=url[:60])
        set_job_result(job_id, {
            "status": "success",
            "source": url,
            "chunks_created": count,
            "characters_extracted": len(text),
        })
    except Exception as e:
        set_job_error(job_id, str(e))

@router.post("/text")
@limiter.limit("10/minute")
async def ingest_text(request: Request, background_tasks: BackgroundTasks, body: TextIngest, x_session_id: str = Header(...)):
    if len(body.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Text is too short to ingest.")
    job_id = create_job()
    background_tasks.add_task(process_text, job_id, body.text, body.source, x_session_id)
    return JSONResponse({"job_id": job_id}, status_code=202)

@router.post("/url")
@limiter.limit("10/minute")
async def ingest_url(request: Request, background_tasks: BackgroundTasks, body: URLIngest, x_session_id: str = Header(...)):
    job_id = create_job()
    background_tasks.add_task(process_url, job_id, body.url, x_session_id)
    return JSONResponse({"job_id": job_id}, status_code=202)