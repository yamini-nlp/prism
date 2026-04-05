# 🔬 Prism — Research Intelligence Platform

![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20FastAPI%20%7C%20Python-1b2e2b?style=flat-square)
![LLM](https://img.shields.io/badge/LLM-LLaMA%203.3%2070B%20via%20Groq-d9c5b2?style=flat-square)
![VectorDB](https://img.shields.io/badge/VectorDB-FAISS%20%2B%20SentenceTransformers-3ecf8e?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-7ecb84?style=flat-square)

A full-stack research intelligence system that transforms complex academic content into clear, grounded, and verifiable insights using Retrieval-Augmented Generation, semantic vector search, and claim-level hallucination detection.

Built with **Next.js + TypeScript** for the frontend and **FastAPI + Python** for the backend.

### 🌐 Live Demo : https://prism-nine-tau.vercel.app/
---

## 1️⃣ Problem Statement

Academic research workflows are fragmented and cognitively expensive. Researchers working with large collections of papers, reports, or documents face persistent challenges:

- No mechanism to query across multiple documents simultaneously in natural language
- No automated summarization that preserves methodological structure (TLDR, key concepts, results, limitations)
- No way to verify whether a generated answer is actually grounded in the source material
- No transparency into which specific passages were retrieved and why

Prism addresses these gaps by building a complete RAG pipeline — from document ingestion to grounded answer generation to claim-level verification — in a single, unified research workspace.

---

## 2️⃣ Why It Matters

**From an NLP research perspective:** Retrieval-Augmented Generation on domain-specific corpora is a well-established technique, but most deployments lack interpretability. Prism exposes the full retrieval layer — chunk similarity scores, source attribution, and confidence metrics — making the generation process auditable rather than opaque.

**From a systems perspective:** The architecture separates concerns cleanly: a Next.js frontend handles the research workspace UI, a FastAPI backend manages ingestion and RAG orchestration, and FAISS provides in-process vector search without external infrastructure dependencies. This makes the system portable and self-contained.

**From a human-computer interaction perspective:** Research workflows require trust. Prism surfaces confidence scores, grounding badges, and hallucination flags alongside every answer — ensuring that generated content is never presented as equivalent to primary sources.

**From a practical perspective:** The system is model-agnostic at the API level; the Groq inference layer can be swapped for any OpenAI-compatible endpoint. The vector store and embedder are similarly replaceable, enabling adaptation to domain-specific embedding models.

---

## 3️⃣ Input Data

Prism operates on **user-supplied research documents as live inference input**. No pre-existing benchmark dataset is required.

Supported ingestion formats:

| Format | Method | Notes |
|---|---|---|
| PDF | `pypdf` page extraction | Handles multi-page academic papers |
| DOCX | `python-docx` paragraph extraction | Preserves paragraph structure |
| TXT | UTF-8 decode | Plain text, preprints, notes |
| URL | `httpx` + `BeautifulSoup` scraping | Strips nav/footer/ads before embedding |
| Raw Text | Direct API endpoint | Paste-in content, abstracts, excerpts |

All text is chunked using a sliding window strategy and embedded using `sentence-transformers/all-MiniLM-L6-v2` before storage in a FAISS flat index.

---

## 4️⃣ Methodology

The system follows a **multi-stage RAG pipeline** with a strict minimum similarity threshold to suppress irrelevant retrievals.

```
User Document (PDF / DOCX / URL / Text)
        │
        ▼
  [Ingestion Layer — FastAPI]
  - Format-specific text extraction
  - Sliding window chunking (~500 chars, 50-char overlap)
  - Sentence-transformer embedding (all-MiniLM-L6-v2)
  - FAISS flat index storage (L2 distance)
        │
        ▼
  [Retrieval Layer]
  - Query embedded with same model
  - FAISS top-K similarity search
  - Minimum similarity threshold filter (score ≥ 0.45)
  - Confidence score = average similarity × 100
        │
        ▼
  [Generation Layer — Groq API]
  - Retrieved chunks assembled as context
  - System prompt enforces grounding rules
  - LLaMA 3.3 70B generates answer with inline source attribution
  - Response latency tracked per query
        │
        ▼
  [Verification Layer]
  - Claim-level hallucination detection
  - Each claim cross-checked against retrieved chunks
  - Unsupported claims flagged with warning badge
        │
        ▼
  [Frontend Workspace — Next.js]
  - Answer rendered with markdown formatting
  - Citations expandable per source chunk
  - Confidence bar + grounding status displayed
  - Query log persisted to localStorage for evaluation metrics
```

---

## 5️⃣ Model Architecture

**LLM Backbone**

| Property | Value |
|---|---|
| Model | `llama-3.3-70b-versatile` |
| Provider | Groq (low-latency inference) |
| Deployment | FastAPI route (`/generate/`) |
| Prompt Strategy | System prompt with strict grounding rules + context injection |
| Temperature | 0.1 (low, for factual consistency) |
| Max Tokens | 1024 per response |

**Embedding + Retrieval**

| Property | Value |
|---|---|
| Embedding Model | `sentence-transformers/all-MiniLM-L6-v2` |
| Vector Store | FAISS (FlatL2 index, in-process) |
| Chunk Size | ~500 characters with 50-character overlap |
| Similarity Metric | L2 distance (normalized to 0–1 score) |
| Min Score Threshold | 0.45 (chunks below this are filtered out) |
| Default Top-K | 5 (configurable via Settings page, 1–20) |

**Summarization Pipeline**

When a document is ingested, a parallel call to `/summary/` generates a structured brief:

| Field | Description |
|---|---|
| `tldr` | Single-sentence summary (≤ 60 words) |
| `key_concepts` | 4–6 key technical terms |
| `methodology` | 2–3 sentences on research approach |
| `results` | 2–3 sentences on findings |
| `limitations` | 1–2 sentences on acknowledged gaps |

---

## 6️⃣ Results

The following observations are drawn from manual evaluation across test documents including academic preprints, technical reports, and research papers.

| Metric | Observation |
|---|---|
| Answer Grounding | Responses remain within retrieved context; hallucination rate near 0% on well-ingested documents |
| Source Relevance | Similarity threshold at 0.45 effectively suppresses off-topic acknowledgment/boilerplate chunks |
| Summarization Quality | Structured summaries preserve methodological hierarchy (TLDR → methods → results → limits) |
| Confidence Calibration | High similarity scores (>0.75) correlate with more complete, specific answers |
| Retrieval Transparency | Source trace page correctly exposes per-chunk similarity with lexical/contextual breakdown |
| Inference Latency | Groq returns completions in 1–3 seconds; embedding and retrieval add <100ms locally |

---

## 7️⃣ Limitations

- **In-memory vector store:** FAISS index is not persisted to disk between backend restarts; all documents must be re-ingested after a restart. A persistence layer (SQLite-backed FAISS or ChromaDB) would resolve this.
- **Single-user, session-scoped:** There is no user authentication or multi-tenancy. All ingested documents share a single FAISS index within a backend process.
- **Embedding model generality:** `all-MiniLM-L6-v2` is a general-purpose model; domain-specific embedding models (e.g., fine-tuned on scientific text) would improve retrieval precision for highly technical content.
- **Chunk boundary sensitivity:** Fixed-size chunking can split sentences across chunk boundaries, reducing coherence of retrieved passages. Semantic chunking would improve this.
- **Evaluation metrics are session-based:** The evaluation dashboard derives metrics from `localStorage` query logs, which are browser-local and reset on clearing storage. No server-side analytics are persisted.
- **No streaming responses:** Answers are returned as complete JSON objects. Streaming token-by-token output would improve perceived latency for long responses.

---

## 8️⃣ Future Work

- Persistent FAISS index with disk serialization, or migration to ChromaDB / Qdrant for multi-session document retention
- User authentication and isolated per-user vector stores via Supabase Auth + row-level security
- Streaming response support using FastAPI `StreamingResponse` and the Groq streaming API
- Domain-specific embedding models fine-tuned on scientific literature (e.g., SPECTER, SciBERT)
- Semantic chunking using sentence boundary detection rather than fixed character windows
- Multi-document citation graphs — visualizing which papers cite similar sources or share key concepts
- Longitudinal query analytics: track how confidence, latency, and retrieval precision evolve as the library grows
- Named entity and topic extraction across the full library to surface cross-document themes
- Export functionality: download answers with citations as formatted PDF or BibTeX references
- Multi-language ingestion support extending the embedding pipeline to non-English documents

---

## 9️⃣ How to Run

**Prerequisites**

- Node.js ≥ 18 and npm
- Python 3.10+
- A Groq API key (free tier available at [console.groq.com](https://console.groq.com))

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/prism.git
cd prism
```

**2. Backend Setup**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install fastapi "uvicorn[standard]" python-multipart pypdf python-docx \
  groq faiss-cpu sentence-transformers httpx beautifulsoup4 python-dotenv numpy
```

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`
Interactive API docs: `http://localhost:8000/docs`

**3. Frontend Setup**

```bash
cd ../frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`

> ⚠️ The Groq API key must never appear in the frontend. It lives only in `backend/.env` and is called exclusively through the FastAPI backend.

---

## 🔟 Conclusion

Prism demonstrates how Retrieval-Augmented Generation, semantic vector search, and structured LLM inference can be composed into a research workflow tool that is simultaneously powerful and interpretable. The pipeline's strict grounding rules, minimum similarity thresholds, and claim-level verification layer ensure that generated answers remain anchored to the actual source material — making Prism suitable for contexts where accuracy and auditability matter. The separation of the ingestion, retrieval, generation, and verification stages into discrete API routes also makes the system modular and extensible, providing a clear foundation for future enhancements including persistent storage, multi-user support, and domain-specific embedding models.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Framer Motion |
| Styling | Inline styles + CSS variables (no Tailwind dependency) |
| AI Inference | LLaMA 3.3 70B via Groq API |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` |
| Vector Store | FAISS (in-process, FlatL2 index) |
| Backend / API | FastAPI (Python), Uvicorn |
| Document Parsing | pypdf, python-docx, BeautifulSoup |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
