import numpy as np
import faiss
import os
import pickle
import re
from fastembed import TextEmbedding

EMBED_DIM = 384
_BASE      = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INDEX_PATH = os.path.join(_BASE, "data", "faiss_index.bin")
META_PATH  = os.path.join(_BASE, "data", "metadata.pkl")

_index    = None
_metadata = []
_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = TextEmbedding("BAAI/bge-small-en-v1.5")
    return _embedder

def get_index():
    global _index, _metadata
    if _index is None:
        if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
            _index = faiss.read_index(INDEX_PATH)
            with open(META_PATH, "rb") as f:
                _metadata = pickle.load(f)
        else:
            _index    = faiss.IndexFlatIP(EMBED_DIM)
            _metadata = []
    return _index, _metadata

def _save():
    os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)
    faiss.write_index(_index, INDEX_PATH)
    with open(META_PATH, "wb") as f:
        pickle.dump(_metadata, f)

def _embed(texts: list[str]) -> np.ndarray:
    embedder = get_embedder()
    vecs = np.array(list(embedder.embed(texts)), dtype=np.float32)
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    return vecs / norms

def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> list[str]:
    text  = re.sub(r'\s+', ' ', text).strip()
    words = text.split(' ')
    chunks, start = [], 0
    while start < len(words):
        end   = min(start + chunk_size, len(words))
        chunk = ' '.join(words[start:end]).strip()
        if len(chunk) > 30:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

def embed_and_store(chunks: list[str], source: str) -> int:
    if not chunks:
        return 0
    index, metadata = get_index()
    BATCH = 64
    all_vecs = []
    for i in range(0, len(chunks), BATCH):
        all_vecs.append(_embed(chunks[i:i + BATCH]))
    vecs = np.vstack(all_vecs)
    index.add(vecs)
    for i, chunk in enumerate(chunks):
        metadata.append({"source": source, "chunk": chunk, "chunk_index": i})
    _save()
    return len(chunks)

def search(query: str, top_k: int = 5) -> list[dict]:
    index, metadata = get_index()
    if index.ntotal == 0:
        return []
    qv = _embed([query])
    k  = min(top_k, index.ntotal)
    scores, indices = index.search(qv, k)
    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0:
            continue
        m = metadata[idx]
        results.append({
            "chunk":       m["chunk"],
            "source":      m["source"],
            "score":       float(score),
            "chunk_index": m["chunk_index"],
        })
    return results