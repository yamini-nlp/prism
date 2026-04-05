import numpy as np
import faiss
import os
import pickle
import re
from sklearn.feature_extraction.text import TfidfVectorizer

EMBED_DIM  = 384
_BASE      = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INDEX_PATH = os.path.join(_BASE, "data", "faiss_index.bin")
META_PATH  = os.path.join(_BASE, "data", "metadata.pkl")
TFIDF_PATH = os.path.join(_BASE, "data", "tfidf.pkl")

_index     = None
_metadata  = []
_vectorizer = None

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

def get_vectorizer():
    global _vectorizer
    if _vectorizer is None:
        if os.path.exists(TFIDF_PATH):
            with open(TFIDF_PATH, "rb") as f:
                _vectorizer = pickle.load(f)
        else:
            _vectorizer = TfidfVectorizer(max_features=EMBED_DIM, sublinear_tf=True)
    return _vectorizer

def _save():
    os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)
    faiss.write_index(_index, INDEX_PATH)
    with open(META_PATH, "wb") as f:
        pickle.dump(_metadata, f)
    with open(TFIDF_PATH, "wb") as f:
        pickle.dump(_vectorizer, f)

def _embed(texts: list[str]) -> np.ndarray:
    vec = get_vectorizer()
    try:
        vecs = vec.transform(texts).toarray().astype(np.float32)
    except Exception:
        vecs = vec.fit_transform(texts).toarray().astype(np.float32)
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    return vecs / norms

def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> list[str]:
    text  = re.sub(r'\s+', ' ', text).strip()
    words = text.split()
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
    vec = get_vectorizer()
    vecs = vec.fit_transform(chunks).toarray().astype(np.float32)
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    vecs = vecs / norms
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
        results.append({"chunk": m["chunk"], "source": m["source"], "score": float(score), "chunk_index": m["chunk_index"]})
    return results