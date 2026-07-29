import os
import re
import uuid
from fastapi import APIRouter, UploadFile, File, Request, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
import tempfile
from pypdf import PdfReader
from docx import Document as DocxDocument
from core.embedder import chunk_text, embed_and_store
from core.auth import get_current_user, get_session_id
from core.models import User
from core.limiter import limiter, UPLOAD_RATE_LIMIT
from core.jobs import create_job, set_job_result, set_job_error, set_job_stage, is_job_cancelled
from core.db import get_db, AsyncSessionLocal
from core.errors import ValidationAppError
from core.config import settings
from core import schemas

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}
ALLOWED_MIME_TYPES = {
    ".pdf": {"application/pdf"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    ".doc": {"application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    ".txt": {"text/plain", "text/plain; charset=utf-8"},
}
MAX_UPLOAD_SIZE_BYTES = settings.max_upload_size_bytes
FILENAME_SAFE_RE = re.compile(r"[^A-Za-z0-9._-]+")
PDF_MAGIC = b"%PDF-"
ZIP_MAGIC = b"PK"
OLE_MAGIC = b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"


def sanitize_filename(filename: str) -> str:
    base = os.path.basename(filename or "")
    base = base.replace("\x00", "")
    base = FILENAME_SAFE_RE.sub("_", base).strip("._")
    if not base:
        base = f"upload-{uuid.uuid4().hex}"
    return base[:255]


def _looks_like_pdf(content: bytes) -> bool:
    return content[:5] == PDF_MAGIC


def _looks_like_docx(content: bytes) -> bool:
    if content[:2] != ZIP_MAGIC:
        return False
    header = content[:4096]
    return b"word/" in header or b"[Content_Types].xml" in header


def _looks_like_legacy_doc(content: bytes) -> bool:
    return content[:8] == OLE_MAGIC


def _looks_like_text(content: bytes) -> bool:
    if b"\x00" in content[:1024]:
        return False
    try:
        content.decode("utf-8")
        return True
    except UnicodeDecodeError:
        return False


def validate_upload_content(ext: str, content: bytes) -> None:
    if not content:
        raise ValidationAppError("Uploaded file is empty.", details={"file_extension": ext})

    if ext == ".pdf":
        if not _looks_like_pdf(content):
            raise ValidationAppError("File content does not match a valid PDF file.", details={"file_extension": ext})
    elif ext == ".docx":
        if not _looks_like_docx(content):
            raise ValidationAppError("File content does not match a valid DOCX file.", details={"file_extension": ext})
    elif ext == ".doc":
        if not (_looks_like_legacy_doc(content) or _looks_like_docx(content)):
            raise ValidationAppError("File content does not match a valid DOC file.", details={"file_extension": ext})
    elif ext == ".txt":
        if not _looks_like_text(content):
            raise ValidationAppError("File content does not match a valid text file.", details={"file_extension": ext})
    else:
        raise ValidationAppError(f"File type {ext} not supported.", details={"file_extension": ext})


async def read_upload_with_limit(file: UploadFile, max_bytes: int) -> bytes:
    chunks = []
    total = 0
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise ValidationAppError(
                f"File exceeds maximum allowed size of {max_bytes} bytes.",
                details={"max_bytes": max_bytes},
            )
        chunks.append(chunk)
    return b"".join(chunks)


def extract_pdf(path: str) -> str:
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()

def extract_docx(path: str) -> str:
    doc = DocxDocument(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

async def process_upload(job_id: str, content: bytes, filename: str, ext: str, session_id: str):
    async with AsyncSessionLocal() as db:
        try:
            if await is_job_cancelled(db, job_id):
                return

            await set_job_stage(db, job_id, "parsing")

            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
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

            if await is_job_cancelled(db, job_id):
                return

            if not text or len(text) < 50:
                await set_job_error(db, job_id, "Could not extract meaningful text from file.")
                return

            await set_job_stage(db, job_id, "chunking")
            chunks = chunk_text(text)

            if await is_job_cancelled(db, job_id):
                return

            await set_job_stage(db, job_id, "embedding")
            count = await embed_and_store(db, chunks, source=filename or "Uploaded Document", session_id=session_id)

            if await is_job_cancelled(db, job_id):
                return

            await set_job_result(db, job_id, {
                "status": "success",
                "source": filename,
                "chunks_created": count,
                "characters_extracted": len(text),
                "preview": text[:500] + ("..." if len(text) > 500 else ""),
            })
        except Exception as e:
            await set_job_error(db, job_id, str(e))

@router.post(
    "/",
    response_model=schemas.JobAcceptedResponse,
    status_code=202,
    summary="Upload a document",
    description="Accept a PDF, DOCX, DOC, or TXT file and process its text into embedded chunks in the background. Returns a job id for status polling.",
)
@limiter.limit(UPLOAD_RATE_LIMIT)
async def upload_file(request: Request, background_tasks: BackgroundTasks, file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    session_id = get_session_id(current_user)
    sanitized_filename = sanitize_filename(file.filename)
    ext = os.path.splitext(sanitized_filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationAppError(f"File type {ext} not supported.", details={"file_extension": ext})

    content = await read_upload_with_limit(file, MAX_UPLOAD_SIZE_BYTES)
    validate_upload_content(ext, content)

    job_id = await create_job(db, session_id=session_id)
    background_tasks.add_task(process_upload, job_id, content, sanitized_filename, ext, session_id)

    return schemas.JobAcceptedResponse(job_id=job_id)