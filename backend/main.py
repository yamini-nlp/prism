import os
from fastapi import FastAPI, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from routes import upload, ingest, retrieve, generate, summary, verify
from core import embedder
from core.auth import verify_api_key
from core.limiter import limiter

app = FastAPI(title="Prism Backend", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

default_origins = "http://localhost:3000,http://127.0.0.1:3000,https://prism-nine-tau.vercel.app"
allowed_origins = os.getenv("ALLOWED_ORIGINS", default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router,   prefix="/upload",   tags=["upload"])
app.include_router(ingest.router,   prefix="/ingest",   tags=["ingest"])
app.include_router(retrieve.router, prefix="/retrieve", tags=["retrieve"])
app.include_router(generate.router, prefix="/generate", tags=["generate"])
app.include_router(summary.router,  prefix="/summary",  tags=["summary"])
app.include_router(verify.router,   prefix="/verify",   tags=["verify"])

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/documents/", dependencies=[Depends(verify_api_key)])
def get_documents(x_session_id: str = Header(...)):
    return embedder.get_documents(x_session_id)

@app.delete("/reset/", dependencies=[Depends(verify_api_key)])
def reset(x_session_id: str = Header(...)):
    embedder.reset_storage(x_session_id)
    return {"status": "reset complete"}