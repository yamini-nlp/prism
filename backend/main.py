from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import upload, ingest, retrieve, generate, summary, verify
from core import embedder

app = FastAPI(title="Prism Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://prism-nine-tau.vercel.app",
    ],
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

@app.get("/documents/")
def get_documents():
    return embedder.documents

@app.delete("/reset/")
def reset():
    embedder.reset_storage()
    return {"status": "reset complete"}