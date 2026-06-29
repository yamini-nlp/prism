import numpy as np
import faiss
import os
import json
import joblib
import re
import uuid
from datetime import datetime
from sentence_transformers import SentenceTransformer

EMBED_DIM  = 384
_BASE      = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR   = os.environ.get("DATA_DIR", os.path.join(_BASE, "data"))
INDEX_PATH = os.path.join(DATA_DIR, "prism_index.faiss")
DOCS_PATH  = os.path.join(DATA_DIR, "documents.json")
CHUNKS_PATH = os.path.join(DATA_DIR, "chunks.json")

EMBEDDING_MODEL = SentenceTransformer("all-MiniLM-L6-v2")

_index    = None
_metadata = []
documents = []
chunks    = []

def init_storage():
    global _index, _metadata, documents, chunks
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(INDEX_PATH) and os.path.exists(DOCS_PATH) and os.path.exists(CHUNKS_PATH):
        _index = faiss.read_index(INDEX_PATH)
        with open(DOCS_PATH) as f:
            documents = json.load(f)
        with open(CHUNKS_PATH) as f:
            chunks = json.load(f)
        _metadata = chunks
    else:
        _index    = faiss.IndexFlatIP(EMBED_DIM)
        _metadata = []
        documents = []
        chunks    = []

def save_storage():
    os.makedirs(DATA_DIR, exist_ok=True)
    faiss.write_index(_index, INDEX_PATH)
    with open(DOCS_PATH, "w") as f:
        json.dump(documents, f)
    with open(CHUNKS_PATH, "w") as f:
        json.dump(chunks, f)

def reset_storage():
    global _index, _metadata, documents, chunks
    _index    = faiss.IndexFlatIP(EMBED_DIM)
    _metadata = []
    documents = []
    chunks    = []
    for path in [INDEX_PATH, DOCS_PATH, CHUNKS_PATH]:
        if os.path.exists(path):
            os.remove(path)

def embed_chunks(texts: list[str]) -> np.ndarray:
    embeddings = EMBEDDING_MODEL.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return embeddings.astype("float32")

def embed_query(query: str) -> np.ndarray:
    embedding = EMBEDDING_MODEL.encode([query], normalize_embeddings=True, show_progress_bar=False)
    return embedding.astype("float32")

def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> list[str]:
    text  = re.sub(r'\s+', ' ', text).strip()
    words = text.split()
    result, start = [], 0
    while start < len(words):
        end   = min(start + chunk_size, len(words))
        chunk = ' '.join(words[start:end]).strip()
        if len(chunk) > 30:
            result.append(chunk)
        start += chunk_size - overlap
    return result

def embed_and_store(text_chunks: list[str], source: str, source_type: str = "text", title: str = None) -> int:
    global _index, _metadata, documents, chunks
    if not text_chunks:
        return 0
    if _index is None:
        init_storage()
    vecs = embed_chunks(text_chunks)
    chunk_start_index = len(chunks)
    _index.add(vecs)
    for i, chunk in enumerate(text_chunks):
        entry = {"source": source, "chunk": chunk, "chunk_index": i}
        _metadata.append(entry)
        chunks.append(entry)
    doc_title = title if title else (source if len(source) <= 60 else source[:60])
    documents.append({
        "id": str(uuid.uuid4()),
        "title": doc_title,
        "source_type": source_type,
        "chunk_count": len(text_chunks),
        "chunk_start_index": chunk_start_index,
        "ingested_at": datetime.utcnow().isoformat()
    })
    save_storage()
    return len(text_chunks)

def search(query: str, top_k: int = 5, threshold: float = 0.45) -> list[dict]:
    if _index is None:
        init_storage()
    if _index.ntotal == 0:
        return []
    qv = embed_query(query)
    k  = min(top_k, _index.ntotal)
    scores, indices = _index.search(qv, k)
    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0:
            continue
        if score < threshold:
            continue
        m = _metadata[idx]
        results.append({
            "chunk": m["chunk"],
            "source": m["source"],
            "score": float(score),
            "chunk_index": m["chunk_index"]
        })
    return results

init_storage()