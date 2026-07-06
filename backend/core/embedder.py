import numpy as np
import faiss
import os
import json
import re
import uuid
import threading
from datetime import datetime
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi

EMBED_DIM  = 384
_BASE      = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR   = os.environ.get("DATA_DIR", os.path.join(_BASE, "data"))

_EMBEDDING_MODEL = None
_RERANKER_MODEL = None
_model_lock = threading.Lock()

def _get_embedding_model():
    global _EMBEDDING_MODEL
    if _EMBEDDING_MODEL is None:
        with _model_lock:
            if _EMBEDDING_MODEL is None:
                _EMBEDDING_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    return _EMBEDDING_MODEL

def _get_reranker_model():
    global _RERANKER_MODEL
    if _RERANKER_MODEL is None:
        with _model_lock:
            if _RERANKER_MODEL is None:
                _RERANKER_MODEL = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _RERANKER_MODEL

_SESSION_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")

_sessions = {}
_lock = threading.Lock()

def _validate_session_id(session_id: str) -> str:
    if not session_id or not _SESSION_ID_RE.match(session_id):
        raise ValueError("Invalid session_id")
    return session_id

def _session_dir(session_id: str) -> str:
    return os.path.join(DATA_DIR, session_id)

def _paths(session_id: str):
    d = _session_dir(session_id)
    return (
        os.path.join(d, "prism_index.faiss"),
        os.path.join(d, "documents.json"),
        os.path.join(d, "chunks.json"),
    )

def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())

def _build_bm25(chunks: list[dict]):
    if not chunks:
        return None
    corpus = [_tokenize(c["chunk"]) for c in chunks]
    return BM25Okapi(corpus)

def _new_state():
    return {
        "index": faiss.IndexFlatIP(EMBED_DIM),
        "documents": [],
        "chunks": [],
        "bm25": None,
    }

def init_storage(session_id: str):
    _validate_session_id(session_id)
    with _lock:
        session_dir = _session_dir(session_id)
        os.makedirs(session_dir, exist_ok=True)
        index_path, docs_path, chunks_path = _paths(session_id)
        if os.path.exists(index_path) and os.path.exists(docs_path) and os.path.exists(chunks_path):
            index = faiss.read_index(index_path)
            with open(docs_path) as f:
                documents = json.load(f)
            with open(chunks_path) as f:
                chunks = json.load(f)
            _sessions[session_id] = {
                "index": index,
                "documents": documents,
                "chunks": chunks,
                "bm25": _build_bm25(chunks),
            }
        else:
            _sessions[session_id] = _new_state()
        return _sessions[session_id]

def _get_state(session_id: str):
    _validate_session_id(session_id)
    state = _sessions.get(session_id)
    if state is None:
        state = init_storage(session_id)
    return state

def save_storage(session_id: str):
    _validate_session_id(session_id)
    state = _get_state(session_id)
    session_dir = _session_dir(session_id)
    os.makedirs(session_dir, exist_ok=True)
    index_path, docs_path, chunks_path = _paths(session_id)
    faiss.write_index(state["index"], index_path)
    with open(docs_path, "w") as f:
        json.dump(state["documents"], f)
    with open(chunks_path, "w") as f:
        json.dump(state["chunks"], f)

def reset_storage(session_id: str):
    _validate_session_id(session_id)
    with _lock:
        _sessions[session_id] = _new_state()
        index_path, docs_path, chunks_path = _paths(session_id)
        for path in [index_path, docs_path, chunks_path]:
            if os.path.exists(path):
                os.remove(path)

def get_documents(session_id: str) -> list[dict]:
    state = _get_state(session_id)
    return state["documents"]

def embed_chunks(texts: list[str]) -> np.ndarray:
    embeddings = _get_embedding_model().encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return embeddings.astype("float32")

def embed_query(query: str) -> np.ndarray:
    embedding = _get_embedding_model().encode([query], normalize_embeddings=True, show_progress_bar=False)
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

def embed_and_store(text_chunks: list[str], source: str, session_id: str, source_type: str = "text", title: str = None) -> int:
    if not text_chunks:
        return 0
    state = _get_state(session_id)
    vecs = embed_chunks(text_chunks)
    chunk_start_index = len(state["chunks"])
    state["index"].add(vecs)
    for i, chunk in enumerate(text_chunks):
        entry = {"source": source, "chunk": chunk, "chunk_index": i}
        state["chunks"].append(entry)
    doc_title = title if title else (source if len(source) <= 60 else source[:60])
    state["documents"].append({
        "id": str(uuid.uuid4()),
        "title": doc_title,
        "source_type": source_type,
        "chunk_count": len(text_chunks),
        "chunk_start_index": chunk_start_index,
        "ingested_at": datetime.utcnow().isoformat()
    })
    state["bm25"] = _build_bm25(state["chunks"])
    save_storage(session_id)
    return len(text_chunks)

def _dense_search(state, query: str, top_k: int):
    index = state["index"]
    if index.ntotal == 0:
        return []
    qv = embed_query(query)
    k = min(top_k, index.ntotal)
    scores, indices = index.search(qv, k)
    ranked = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0:
            continue
        ranked.append((int(idx), float(score)))
    return ranked

def _bm25_search(state, query: str, top_k: int):
    bm25 = state["bm25"]
    if bm25 is None or not state["chunks"]:
        return []
    scores = bm25.get_scores(_tokenize(query))
    ranked_idx = np.argsort(scores)[::-1][:top_k]
    return [(int(idx), float(scores[idx])) for idx in ranked_idx if scores[idx] > 0]

def _reciprocal_rank_fusion(dense_ranked, bm25_ranked, k: int = 60):
    fused_scores = {}
    for rank, (idx, _) in enumerate(dense_ranked):
        fused_scores[idx] = fused_scores.get(idx, 0.0) + 1.0 / (k + rank + 1)
    for rank, (idx, _) in enumerate(bm25_ranked):
        fused_scores[idx] = fused_scores.get(idx, 0.0) + 1.0 / (k + rank + 1)
    return sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)

def search(query: str, session_id: str, top_k: int = 5, threshold: float = 0.45) -> list[dict]:
    state = _get_state(session_id)
    index = state["index"]
    if index.ntotal == 0:
        return []
    qv = embed_query(query)
    k  = min(top_k, index.ntotal)
    scores, indices = index.search(qv, k)
    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0:
            continue
        if score < threshold:
            continue
        m = state["chunks"][idx]
        results.append({
            "chunk": m["chunk"],
            "source": m["source"],
            "score": float(score),
            "chunk_index": m["chunk_index"]
        })
    return results

def hybrid_search(query: str, session_id: str, top_k: int = 5) -> list[dict]:
    state = _get_state(session_id)
    if state["index"].ntotal == 0:
        return []
    candidate_k = top_k * 3
    dense_ranked = _dense_search(state, query, candidate_k)
    bm25_ranked = _bm25_search(state, query, candidate_k)
    fused = _reciprocal_rank_fusion(dense_ranked, bm25_ranked)
    candidate_indices = [idx for idx, _ in fused[:candidate_k]]
    if not candidate_indices:
        return []
    candidates = [state["chunks"][idx] for idx in candidate_indices]
    pairs = [[query, c["chunk"]] for c in candidates]
    rerank_scores = _get_reranker_model().predict(pairs)
    order = np.argsort(rerank_scores)[::-1][:top_k]
    results = []
    for pos in order:
        m = candidates[pos]
        results.append({
            "chunk": m["chunk"],
            "source": m["source"],
            "score": float(rerank_scores[pos]),
            "chunk_index": m["chunk_index"]
        })
    return results