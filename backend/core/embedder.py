from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import os
import pickle
import re

MODEL_NAME = "all-MiniLM-L6-v2"
_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INDEX_PATH = os.path.join(_BASE, "data", "faiss_index.bin")
META_PATH  = os.path.join(_BASE, "data", "metadata.pkl")

_model    = None
_index    = None
_metadata = []


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def get_index():
    global _index, _metadata
    if _index is None:
        if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
            _index = faiss.read_index(INDEX_PATH)
            with open(META_PATH, "rb") as f:
                _metadata = pickle.load(f)
        else:
            _index    = faiss.IndexFlatIP(384)
            _metadata = []
    return _index, _metadata


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> list:
    text   = re.sub(r'\s+', ' ', text).strip()
    words  = text.split(' ')
    chunks = []
    start  = 0
    while start < len(words):
        end   = min(start + chunk_size, len(words))
        chunk = ' '.join(words[start:end]).strip()
        if len(chunk) > 30:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def embed_and_store(chunks: list, source: str) -> int:
    if not chunks:
        return 0
    model = get_model()
    index, metadata = get_index()

    vecs = model.encode(chunks, normalize_embeddings=True)
    vecs = np.array(vecs, dtype=np.float32)
    index.add(vecs)

    for i, chunk in enumerate(chunks):
        metadata.append({"source": source, "chunk": chunk, "chunk_index": i})

    os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)
    faiss.write_index(index, INDEX_PATH)
    with open(META_PATH, "wb") as f:
        pickle.dump(metadata, f)

    return len(chunks)


def search(query: str, top_k: int = 5) -> list:
    model = get_model()
    index, metadata = get_index()

    if index.ntotal == 0:
        return []

    qv  = model.encode([query], normalize_embeddings=True)
    qv  = np.array(qv, dtype=np.float32)
    k   = min(top_k, index.ntotal)
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