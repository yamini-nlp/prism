# 🔍 Prism — Research Intelligence Platform

> A full-stack research intelligence system that transforms academic documents into queryable, grounded, and verifiable insights using Retrieval-Augmented Generation, TF-IDF vector search, and claim-level hallucination detection.

**Live Demo:** https://prism-nine-tau.vercel.app &nbsp;|&nbsp; **GitHub:** https://github.com/yamini-nlp/prism

![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20TypeScript%20%7C%20FastAPI-blue?style=flat-square)
![LLM](https://img.shields.io/badge/LLM-LLaMA%203.3%2070B%20%7C%20Groq-orange?style=flat-square)
![VectorDB](https://img.shields.io/badge/VectorDB-FAISS%20%7C%20TF--IDF-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square)

---

## Overview

Prism is a complete RAG pipeline — from document ingestion to grounded answer generation to claim-level verification — in a single unified research workspace. Unlike most RAG deployments, it exposes the full retrieval layer: chunk similarity scores, source attribution, and per-claim grounding status, making the generation process auditable rather than opaque.

The architecture is model-agnostic at the API level: the Groq inference layer can be swapped for any OpenAI-compatible endpoint, and the vector store and embedder are similarly replaceable.

---

## 🎯 Problem Statement

Academic research workflows are fragmented and cognitively expensive. Researchers working with large document collections face persistent challenges:

- No mechanism to query across multiple documents simultaneously in natural language
- No automated summarisation that preserves methodological structure (TLDR, key concepts, results, limitations)
- No way to verify whether a generated answer is actually grounded in the source material
- No transparency into which specific passages were retrieved and why

---

## 📂 Supported Input Formats

| Format | Method | Notes |
|---|---|---|
| PDF | pypdf page extraction | Multi-page academic papers |
| DOCX | python-docx paragraph extraction | Preserves paragraph structure |
| TXT | UTF-8 decode | Plain text, preprints, notes |
| URL | httpx + BeautifulSoup scraping | Strips navigation/footer/ads before embedding |
| Raw text | Direct API endpoint | Paste-in content, abstracts, excerpts |

---

## 🏗️ RAG Pipeline

```
User Document (PDF / DOCX / URL / Text)
        │
        ▼
  [Ingestion Layer — FastAPI]
  ├── Format-specific text extraction
  ├── Sliding window chunking (~400 words, 50-word overlap)
  ├── TF-IDF vectorisation (scikit-learn, 384 features, sublinear TF, L2-normalised)
  └── FAISS FlatIP index storage (cosine similarity via inner product)
        │
        ▼
  [Retrieval Layer]
  ├── Query vectorised with fitted TF-IDF model
  ├── FAISS top-K inner-product search (default K=5, configurable 1–20)
  ├── Minimum similarity threshold filter (score ≥ 0.45)
  └── Confidence score = average similarity × 100
        │
        ▼
  [Generation Layer — Groq API]
  ├── Retrieved chunks assembled as context
  ├── System prompt enforces strict grounding rules
  ├── LLaMA 3.3 70B generates answer with inline source attribution
  └── Response latency tracked per query
        │
        ▼
  [Verification Layer]
  ├── Claim-level hallucination detection
  ├── Each claim cross-checked against retrieved chunks
  └── Unsupported claims flagged with warning badge
        │
        ▼
  [Frontend Workspace — Next.js]
  ├── Answer rendered with markdown formatting
  ├── Citations expandable per source chunk
  └── Confidence bar + grounding status displayed
```

---

## ⚙️ Embedding and Retrieval

| Property | Value |
|---|---|
| Vectorisation | TF-IDF (scikit-learn, `sublinear_tf=True`, `max_features=384`) |
| Vector store | FAISS (`IndexFlatIP`, in-process, cosine similarity) |
| Chunk size | ~400 words with 50-word overlap |
| Similarity metric | Inner product on L2-normalised vectors (cosine similarity) |
| Minimum score threshold | 0.45 — chunks below this are filtered out |
| Default top-K | 5 (configurable via Settings page, 1–20) |

The minimum similarity threshold suppresses off-topic retrievals including acknowledgement sections, boilerplate, and bibliographic content.

---

## 🤖 LLM Configuration

| Property | Value |
|---|---|
| Model | `llama-3.3-70b-versatile` via Groq |
| Deployment | FastAPI route (`/generate/`) |
| Temperature | 0.1 (low, for factual consistency) |
| Max tokens | 1024 per response |
| Grounding | System prompt enforces source-attribution rules |

---

## 📄 Structured Summarisation

When a document is ingested, a parallel call to `/summary/` generates a structured brief:

| Field | Description |
|---|---|
| `tldr` | Single-sentence summary (≤ 60 words) |
| `key_concepts` | 4–6 key technical terms |
| `methodology` | 2–3 sentences on research approach |
| `results` | 2–3 sentences on findings |
| `limitations` | 1–2 sentences on acknowledged gaps |

---

## 📊 Observed Behaviour (Manual Evaluation)

| Metric | Observation |
|---|---|
| Answer grounding | Responses remain within retrieved context on well-ingested documents; hallucination rate approaches zero when relevant chunks are retrieved |
| Source relevance | Similarity threshold at 0.45 effectively suppresses off-topic acknowledgement and boilerplate chunks |
| Summarisation quality | Structured summaries preserve methodological hierarchy (TLDR → methods → results → limitations) |
| Confidence calibration | High similarity scores (>0.75) correlate with more complete, specific answers |
| Inference latency | Groq returns completions in 1–3 seconds; TF-IDF vectorisation and FAISS retrieval add less than 50ms |

*Formal quantitative evaluation against labelled retrieval benchmarks (e.g. BEIR) is identified as future work.*

---

## ⚠️ Limitations

- **In-memory vector store:** FAISS index is not persisted across backend restarts on Render's free tier; documents must be re-ingested after a cold start
- **Single-user, session-scoped:** no user authentication or multi-tenancy; all ingested documents share a single FAISS index within a backend process
- **TF-IDF retrieval ceiling:** captures lexical overlap but lacks semantic understanding; dense embedding models (e.g. `all-MiniLM-L6-v2`, SPECTER) would improve retrieval recall on paraphrased queries
- **Chunk boundary sensitivity:** fixed-size chunking can split sentences across boundaries, reducing coherence of retrieved passages
- **Session-based evaluation metrics:** the evaluation dashboard derives metrics from localStorage query logs, which reset on clearing storage
- **No streaming responses:** answers are returned as complete JSON objects; streaming would improve perceived latency for long responses

---

## 🔭 Future Work

- Replace TF-IDF with a dense embedding model (e.g. fastembed, SPECTER, SciBERT) for semantic retrieval
- Persistent FAISS index with disk serialisation, or migration to ChromaDB / Qdrant for multi-session retention
- User authentication and isolated per-user vector stores via Supabase Auth + RLS
- Streaming response support using FastAPI `StreamingResponse` and the Groq streaming API
- Semantic chunking using sentence boundary detection rather than fixed word-count windows
- Multi-document citation graphs — visualising which papers share sources or key concepts
- Named entity and topic extraction across the full library to surface cross-document themes
- Export: download answers with citations as formatted PDF or BibTeX references
- Multi-language ingestion support

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Framer Motion |
| Styling | Inline styles + CSS variables |
| AI Inference | LLaMA 3.3 70B via Groq API |
| Vectorisation | TF-IDF (scikit-learn, 384-dim, sublinear TF) |
| Vector Store | FAISS (IndexFlatIP, in-process, cosine similarity) |
| Backend / API | FastAPI (Python), Uvicorn |
| Document Parsing | pypdf, python-docx, BeautifulSoup |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## 🚀 Local Setup

**Prerequisites:** Node.js ≥ 18 · Python 3.10+ · Groq API key (free at [console.groq.com](https://console.groq.com))

**1. Clone**
```bash
git clone https://github.com/yamini-nlp/prism.git
cd prism
```

**2. Backend setup**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend:
```bash
uvicorn main:app --reload --port 8000
```
Backend: `http://localhost:8000` &nbsp;|&nbsp; API docs: `http://localhost:8000/docs`

**3. Frontend setup**
```bash
cd ../frontend
npm install
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```
Frontend: `http://localhost:3000`

> ⚠️ The Groq API key must never appear in the frontend. It lives only in `backend/.env` and is called exclusively through the FastAPI backend.

---

## 📁 Repository Structure

```
prism/
├── backend/
│   ├── main.py               # FastAPI — /ingest/ /generate/ /summary/ /query/
│   ├── ingestion.py          # Format-specific text extraction and chunking
│   ├── vectorstore.py        # TF-IDF vectorisation + FAISS index management
│   ├── retrieval.py          # Top-K search with similarity threshold filtering
│   ├── generation.py         # Groq LLM generation with grounding prompt
│   ├── verification.py       # Claim-level hallucination detection
│   └── requirements.txt
├── frontend/
│   ├── pages/
│   │   ├── index.tsx         # Landing page
│   │   ├── workspace.tsx     # Main research workspace
│   │   ├── sources.tsx       # Source trace + per-chunk similarity
│   │   └── settings.tsx      # Top-K and threshold configuration
│   └── package.json
└── README.md
```

---

*Built by Yamini G &nbsp;·&nbsp; [GitHub](https://github.com/yamini-nlp/prism) &nbsp;·&nbsp; [Live Demo](https://prism-nine-tau.vercel.app)*
