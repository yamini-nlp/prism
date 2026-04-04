from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import upload, ingest, retrieve, generate, summary

app = FastAPI(title="Prism Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router,   prefix="/upload",   tags=["upload"])
app.include_router(ingest.router,   prefix="/ingest",   tags=["ingest"])
app.include_router(retrieve.router, prefix="/retrieve", tags=["retrieve"])
app.include_router(generate.router, prefix="/generate", tags=["generate"])
app.include_router(summary.router,  prefix="/summary",  tags=["summary"])

@app.get("/health")
def health():
    return {"status": "ok"}