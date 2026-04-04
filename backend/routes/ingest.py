from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from core.embedder import chunk_text, embed_and_store

router = APIRouter()

class TextIngest(BaseModel):
    text: str
    source: str = "Manual Input"

class URLIngest(BaseModel):
    url: str

@router.post("/text")
async def ingest_text(body: TextIngest):
    if len(body.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Text is too short to ingest.")

    chunks = chunk_text(body.text)
    count = embed_and_store(chunks, source=body.source)

    return JSONResponse({
        "status": "success",
        "source": body.source,
        "chunks_created": count,
        "characters": len(body.text),
    })

@router.post("/url")
async def ingest_url(body: URLIngest):
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
    count = embed_and_store(chunks, source=body.url)

    return JSONResponse({
        "status": "success",
        "source": body.url,
        "chunks_created": count,
        "characters_extracted": len(text),
    })