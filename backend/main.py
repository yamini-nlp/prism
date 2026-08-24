import time
import uuid
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Optional
from alembic import command
from alembic.config import Config as AlembicConfig
from fastapi import APIRouter, FastAPI, Depends, Request, Query, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from routes import upload, ingest, retrieve, generate, summary, verify, analytics, auth as auth_routes
from core import embedder
from core.auth import get_current_user, get_session_id
from core.models import User
from core.limiter import limiter
from core.jobs import get_job, cancel_job, create_job, job_belongs_to_session, set_job_stage, set_job_result, set_job_error
from core.db import get_db, AsyncSessionLocal
from core.config import settings
from core.security import decode_token
from core.logging_config import setup_logging, log_request
from core.metrics import record_request, generate_prometheus_metrics
from core.tracing import setup_tracing
from core.errors import NotFoundError, register_exception_handlers
from eval import evaluate as eval_module

API_VERSION = "1.0.0"

openapi_tags = [
    {"name": "auth", "description": "Account registration, login, token refresh, and session identity."},
    {"name": "upload", "description": "Upload documents (PDF, DOCX, TXT) for asynchronous ingestion."},
    {"name": "ingest", "description": "Ingest raw text or a URL for asynchronous processing into the knowledge base."},
    {"name": "retrieve", "description": "Hybrid dense and lexical retrieval over ingested document chunks."},
    {"name": "generate", "description": "Streamed, retrieval-augmented answer generation with citations."},
    {"name": "summary", "description": "Structured summarization of a research document."},
    {"name": "verify", "description": "Claim-level grounding verification of a generated answer against context."},
    {"name": "jobs", "description": "Status polling for background ingestion jobs."},
    {"name": "documents", "description": "Listing and resetting of ingested documents for a session."},
    {"name": "analytics", "description": "Aggregate, read-only analytics computed from existing session and operational data."},
    {"name": "operational", "description": "Unversioned operational endpoints: health, metrics, and evaluation reports."},
]

app = FastAPI(
    title="Prism Backend",
    version=API_VERSION,
    description="Prism is a retrieval-augmented research intelligence API providing document ingestion, hybrid retrieval, grounded generation, summarization, and claim verification.",
    contact={"name": "Prism Team", "url": "https://prism-nine-tau.vercel.app"},
    openapi_tags=openapi_tags,
)
app.state.limiter = limiter

register_exception_handlers(app)

logger = setup_logging()

setup_tracing(app)

allowed_origins = settings.allowed_origins_list

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=settings.allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Session-Id"],
    expose_headers=["X-Request-ID", "X-Total-Count", "X-Has-More", "X-Next-Cursor"],
)


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_body_bytes: int):
        super().__init__(app)
        self.max_body_bytes = max_body_bytes

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                if int(content_length) > self.max_body_bytes:
                    request_id = getattr(request.state, "request_id", "unknown")
                    return JSONResponse(
                        status_code=413,
                        content={"error": {"code": "payload_too_large", "message": "Request body exceeds the maximum allowed size.", "request_id": request_id, "details": {"max_bytes": self.max_body_bytes}}},
                    )
            except ValueError:
                pass
        return await call_next(request)


class RequestTimeoutMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, timeout_seconds: float):
        super().__init__(app)
        self.timeout_seconds = timeout_seconds

    async def dispatch(self, request: Request, call_next):
        try:
            return await asyncio.wait_for(call_next(request), timeout=self.timeout_seconds)
        except asyncio.TimeoutError:
            request_id = getattr(request.state, "request_id", "unknown")
            return JSONResponse(
                status_code=504,
                content={"error": {"code": "request_timeout", "message": "The request timed out.", "request_id": request_id, "details": None}},
            )


app.add_middleware(BodySizeLimitMiddleware, max_body_bytes=settings.max_request_body_bytes)
app.add_middleware(RequestTimeoutMiddleware, timeout_seconds=settings.request_timeout_seconds)


def _run_migrations_sync() -> None:
    backend_dir = Path(__file__).resolve().parent
    alembic_cfg = AlembicConfig(str(backend_dir / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    command.upgrade(alembic_cfg, "head")


@app.on_event("startup")
async def apply_database_migrations() -> None:
    try:
        await asyncio.wait_for(asyncio.to_thread(_run_migrations_sync), timeout=20)
    except asyncio.TimeoutError:
        logger.error("Database migration timed out after 20s; continuing startup without applying migrations.")
    except Exception as exc:
        logger.error(f"Database migration failed on startup: {exc}")


def _extract_user_id(request: Request) -> Optional[str]:
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        payload = decode_token(token)
        if payload and payload.get("type") == "access" and payload.get("sub"):
            return payload["sub"]
    return None


@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    start = time.perf_counter()
    response = await call_next(request)
    latency_ms = round((time.perf_counter() - start) * 1000, 2)

    route = request.url.path
    session_id = request.headers.get("x-session-id")
    user_id = _extract_user_id(request)

    record_request(route, latency_ms, response.status_code)
    log_request(
        logger,
        request_id=request_id,
        route=route,
        latency_ms=latency_ms,
        status_code=response.status_code,
        session_id=session_id,
        user_id=user_id,
    )

    response.headers["X-Request-ID"] = request_id
    return response


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


api_v1 = APIRouter()

api_v1.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
api_v1.include_router(upload.router,   prefix="/upload",   tags=["upload"])
api_v1.include_router(ingest.router,   prefix="/ingest",   tags=["ingest"])
api_v1.include_router(retrieve.router, prefix="/retrieve", tags=["retrieve"])
api_v1.include_router(generate.router, prefix="/generate", tags=["generate"])
api_v1.include_router(summary.router,  prefix="/summary",  tags=["summary"])
api_v1.include_router(verify.router,   prefix="/verify",   tags=["verify"])
api_v1.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@api_v1.get(
    "/jobs/{job_id}",
    tags=["jobs"],
    summary="Get background job status",
    description="Poll the status of a background ingestion job (upload, text ingest, or URL ingest) by job id.",
)
async def get_job_status(job_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    session_id = get_session_id(current_user)
    owned = await job_belongs_to_session(db, job_id, session_id)
    if not owned:
        raise NotFoundError("Job not found", details={"job_id": job_id})
    job = await get_job(db, job_id)
    if job is None:
        raise NotFoundError("Job not found", details={"job_id": job_id})
    return job


@api_v1.delete(
    "/jobs/{job_id}",
    tags=["jobs"],
    summary="Cancel a background job",
    description="Cancel a background ingestion job (upload, text ingest, or URL ingest) by job id if it has not already reached a terminal state.",
)
async def cancel_job_status(job_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    session_id = get_session_id(current_user)
    owned = await job_belongs_to_session(db, job_id, session_id)
    if not owned:
        raise NotFoundError("Job not found", details={"job_id": job_id})
    job = await cancel_job(db, job_id)
    if job is None:
        raise NotFoundError("Job not found", details={"job_id": job_id})
    return job


@api_v1.get(
    "/documents/",
    tags=["documents"],
    summary="List ingested documents",
    description="List documents ingested for the current session, ordered by ingestion time. Supports full-text search, filtering, sorting, and pagination via query parameters; with no query parameters supplied it returns the full unfiltered list as before.",
)
async def get_documents(
    response: Response,
    q: Optional[str] = Query(None, description="Full-text search over document title and content"),
    source_type: Optional[str] = Query(None, description="Filter by document source/type"),
    status: Optional[str] = Query(None, description="Filter by document status"),
    date_from: Optional[datetime] = Query(None, description="Only include documents ingested on or after this timestamp"),
    date_to: Optional[datetime] = Query(None, description="Only include documents ingested on or before this timestamp"),
    sort_by: str = Query("ingested_at", description="Field to sort by: title, ingested_at, updated_at, chunk_count, size_bytes"),
    sort_dir: str = Query("asc", description="Sort direction: asc or desc"),
    limit: Optional[int] = Query(None, ge=1, le=200, description="Maximum number of documents to return"),
    offset: int = Query(0, ge=0, description="Number of documents to skip"),
    cursor: Optional[str] = Query(None, description="Opaque pagination cursor, alternative to offset"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session_id = get_session_id(current_user)
    has_query_params = any(
        v is not None
        for v in (q, source_type, status, date_from, date_to, limit, cursor)
    ) or sort_by != "ingested_at" or sort_dir != "asc" or offset != 0

    if not has_query_params:
        return await embedder.get_documents(db, session_id)

    result = await embedder.list_documents(
        db,
        session_id,
        q=q,
        source_type=source_type,
        status=status,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
        cursor=cursor,
    )
    response.headers["X-Total-Count"] = str(result["total"])
    response.headers["X-Has-More"] = "true" if result["has_more"] else "false"
    if result["next_cursor"]:
        response.headers["X-Next-Cursor"] = result["next_cursor"]
    return result["items"]


@api_v1.delete(
    "/documents/{document_id}",
    tags=["documents"],
    summary="Delete a single document",
    description="Delete one ingested document and its chunks, scoped to the current session, without affecting other documents.",
)
async def delete_document(document_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await embedder.delete_document(db, get_session_id(current_user), document_id)
    return {"status": "deleted", "document_id": document_id}


@api_v1.delete(
    "/reset/",
    tags=["documents"],
    summary="Reset session documents",
    description="Delete all ingested documents and chunks for the current session.",
)
async def reset(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await embedder.reset_storage(db, get_session_id(current_user))
    return {"status": "reset complete"}


app.include_router(api_v1, prefix="/api/v1")


@app.get(
    "/health",
    tags=["operational"],
    summary="Health check",
    description="Liveness probe for the Prism backend service.",
)
def health():
    return {"status": "ok"}


@app.get(
    "/metrics",
    tags=["operational"],
    summary="Service metrics",
    description="Aggregate request and cache metrics collected since process start, in Prometheus text exposition format.",
)
def metrics():
    return PlainTextResponse(generate_prometheus_metrics(), media_type="text/plain; version=0.0.4; charset=utf-8")


@app.get(
    "/eval-report",
    tags=["operational"],
    summary="Evaluation report",
    description="Return the most recently generated offline evaluation report, if one exists.",
)
def get_eval_report():
    report_path = Path(__file__).resolve().parent / "eval" / "report.md"
    if not report_path.exists():
        raise NotFoundError(
            "Evaluation report not found. Run backend/eval/evaluate.py to generate one.",
        )
    content = report_path.read_text(encoding="utf-8")
    generated_at = datetime.fromtimestamp(report_path.stat().st_mtime).isoformat()
    return {"content": content, "generated_at": generated_at}


async def _run_eval_job(job_id: str) -> None:
    async with AsyncSessionLocal() as db:
        try:
            await set_job_stage(db, job_id, "chunking")
            result = await eval_module.run_evaluation(print_progress=False)
            await set_job_result(db, job_id, result)
        except Exception as e:
            await set_job_error(db, job_id, str(e))


@app.post(
    "/eval-report/run",
    tags=["operational"],
    status_code=202,
    summary="Re-run the evaluation harness",
    description="Trigger backend/eval/evaluate.py as a background job against the sample dataset and return a job id compatible with the standard job-status polling endpoint.",
)
async def run_eval_report(background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    job_id = await create_job(db, session_id=None)
    background_tasks.add_task(_run_eval_job, job_id)
    return {"job_id": job_id}