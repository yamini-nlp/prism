from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Depends, Header
from fastapi.responses import JSONResponse
import tempfile
import os
from pypdf import PdfReader
from docx import Document as DocxDocument
from core.embedder import chunk_text, embed_and_store
from core.auth import verify_api_key
from core.limiter import limiter

router = APIRouter(dependencies=[Depends(verify_api_key)])

def extract_pdf(path: str) -> str:
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()

def extract_docx(path: str) -> str:
    doc = DocxDocument(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

@router.post("/")
@limiter.limit("10/minute")
async def upload_file(request: Request, file: UploadFile = File(...), x_session_id: str = Header(...)):
    allowed = {".pdf", ".docx", ".doc", ".txt"}
    ext = os.path.splitext(file.filename or "")[1].lower()

    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type {ext} not supported.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if ext == ".pdf":
            text = extract_pdf(tmp_path)
        elif ext in (".docx", ".doc"):
            text = extract_docx(tmp_path)
        elif ext == ".txt":
            text = content.decode("utf-8", errors="ignore")
        else:
            text = ""
    finally:
        os.unlink(tmp_path)

    if not text or len(text) < 50:
        raise HTTPException(status_code=422, detail="Could not extract meaningful text from file.")

    chunks = chunk_text(text)
    count = embed_and_store(chunks, source=file.filename or "Uploaded Document", session_id=x_session_id)

    return JSONResponse({
        "status": "success",
        "source": file.filename,
        "chunks_created": count,
        "characters_extracted": len(text),
        "preview": text[:500] + ("..." if len(text) > 500 else ""),
    })