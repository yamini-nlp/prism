from fastapi import APIRouter, HTTPException, Request, Depends, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from core.embedder import chunk_text, embed_and_store
from core.auth import verify_api_key
from core.limiter import limiter

router = APIRouter(dependencies=[Depends(verify_api_key)])

class TextIngest(BaseModel):
    text: str
    source: str = "Manual Input"

class URLIngest(BaseModel):
    url: str

@router.post("/text")
@limiter.limit("10/minute")
async def ingest_text(request: Request, body: TextIngest, x_session_id: str = Header(...)):
    if len(body.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Text is too short to ingest.")
    chunks = chunk_text(body.text)
    title = body.text.strip()[:60]
    count = embed_and_store(chunks, source=body.source, session_id=x_session_id, source_type="text", title=title)
    return JSONResponse({
        "status": "success",
        "source": body.source,
        "chunks_created": count,
        "characters": len(body.text),
    })

@router.post("/url")
@limiter.limit("10/minute")
async def ingest_url(request: Request, body: URLIngest, x_session_id: str = Header(...)):
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(body.url, headers={"User-Agent": "Mozilla/5.0"})
            response.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    if len(text.strip()) < 100:
        raise HTTPException(status_code=422, detail="Could not extract sufficient text from URL.")
    chunks = chunk_text(text)
    count = embed_and_store(chunks, source=body.url, session_id=x_session_id, source_type="url", title=body.url[:60])
    return JSONResponse({
        "status": "success",
        "source": body.url,
        "chunks_created": count,
        "characters_extracted": len(text),
    })