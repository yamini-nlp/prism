import os
import time
import uuid
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, Depends, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from routes import upload, ingest, retrieve, generate, summary, verify
from core import embedder
from core.auth import verify_api_key
from core.limiter import limiter
from core.jobs import get_job
from core.logging_config import setup_logging, log_request
from core.metrics import record_request, get_metrics

app = FastAPI(title="Prism Backend", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

logger = setup_logging()

default_origins = "http://localhost:3000,http://127.0.0.1:3000,https://prism-nine-tau.vercel.app"
allowed_origins = os.getenv("ALLOWED_ORIGINS", default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start = time.perf_counter()
    response = await call_next(request)
    latency_ms = round((time.perf_counter() - start) * 1000, 2)

    route = request.url.path
    session_id = request.headers.get("x-session-id")

    record_request(route, latency_ms)
    log_request(
        logger,
        request_id=request_id,
        route=route,
        latency_ms=latency_ms,
        status_code=response.status_code,
        session_id=session_id,
    )

    response.headers["X-Request-ID"] = request_id
    return response


app.include_router(upload.router,   prefix="/upload",   tags=["upload"])
app.include_router(ingest.router,   prefix="/ingest",   tags=["ingest"])
app.include_router(retrieve.router, prefix="/retrieve", tags=["retrieve"])
app.include_router(generate.router, prefix="/generate", tags=["generate"])
app.include_router(summary.router,  prefix="/summary",  tags=["summary"])
app.include_router(verify.router,   prefix="/verify",   tags=["verify"])

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/metrics")
def metrics():
    return get_metrics()

@app.get("/eval-report")
def get_eval_report():
    report_path = Path(__file__).resolve().parent / "eval" / "report.md"
    if not report_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Evaluation report not found. Run backend/eval/evaluate.py to generate one.",
        )
    content = report_path.read_text(encoding="utf-8")
    generated_at = datetime.fromtimestamp(report_path.stat().st_mtime).isoformat()
    return {"content": content, "generated_at": generated_at}

@app.get("/jobs/{job_id}")
def get_job_status(job_id: str):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.get("/documents/", dependencies=[Depends(verify_api_key)])
def get_documents(x_session_id: str = Header(...)):
    return embedder.get_documents(x_session_id)

@app.delete("/reset/", dependencies=[Depends(verify_api_key)])
def reset(x_session_id: str = Header(...)):
    embedder.reset_storage(x_session_id)
    return {"status": "reset complete"}