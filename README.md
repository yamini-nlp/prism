# 🔍 Prism — Research Intelligence Platform

**A full-stack retrieval-augmented research platform** — hybrid dense + lexical retrieval, cross-encoder reranking, streamed grounded generation, and claim-level hallucination detection, backed by authenticated multi-user storage and background job processing.

**Live Demo:** https://prism-nine-tau.vercel.app/

**Repository:** https://github.com/yamini-nlp/prism

![Stack](https://img.shields.io/badge/Stack-Next.js%2016%20%7C%20FastAPI%20%7C%20PostgreSQL-blue?style=flat-square)
![LLM](https://img.shields.io/badge/LLM-GPT--OSS%20120B%20%7C%20Groq-orange?style=flat-square)
![Retrieval](https://img.shields.io/badge/Retrieval-pgvector%20%7C%20BM25%20%7C%20Cross--Encoder-green?style=flat-square)
![CI](https://img.shields.io/badge/CI-pytest%20%7C%20ruff%20%7C%20mypy%20%7C%20Playwright-informational?style=flat-square)

---

## 💡 Motivation

Most RAG demos stop at "ask a question, get an answer." Prism was built to answer a narrower, harder question: how much of that answer can you actually trust, and can a second user rely on the same system without stepping on the first user's documents? That constraint pulled the project past a single retrieval script into a system with real accounts, per-user data isolation, background job processing for slow ingestion work, and an evaluation harness that reports retrieval and groundedness numbers with confidence intervals rather than a single anecdotal accuracy figure.

The codebase has gone through two distinct architectures. An early version — described in an accompanying technical report, `paper/Prism.pdf` — used TF-IDF vectorisation and a FAISS flat index. **That PDF is not present in the current repository snapshot** (see Audit Notes below), so its figures are reproduced here as previously published rather than independently re-verified. The system now ships with dense sentence-transformer embeddings stored in Postgres via pgvector, fused with BM25 lexical search and reranked with a cross-encoder. Both the report's numbers and the current architecture are described below, clearly separated so neither is mistaken for the other.

---

## 🎯 Problem Statement

Researchers working across large document collections run into the same three walls repeatedly:

- Keyword search returns raw passages, not synthesised answers, and misses relevant text when query vocabulary doesn't match document vocabulary.
- General-purpose LLM answers are fluent but ungrounded — there's no way to check whether a claim actually came from the source material.
- Single-user prototypes don't reflect how the tool would actually be used: real deployments need accounts, isolated data per user, and a way to see what's actually happening under load (latency, cache hit rate, error rate).

Prism treats all three as first-class requirements rather than deferring them to "future work."

---

## 📂 Supported Input Formats

| Format | Method | Notes |
|---|---|---|
| PDF | `pypdf` page extraction | Magic-byte validated before parsing |
| DOCX / DOC | `python-docx` paragraph extraction | Zip/OLE header validated before parsing |
| TXT | UTF-8 decode | Rejected if it contains binary content |
| URL | `httpx` + BeautifulSoup scraping | Strips script/style/nav/footer/header/aside before embedding |
| Raw text | Direct API endpoint | Paste-in content, abstracts, excerpts |

All ingestion paths run as background jobs: the API returns a `job_id` immediately (`202 Accepted`) and the client polls `/api/v1/jobs/{job_id}` through `uploading → parsing → chunking → embedding → ready` stages, with cancellation support at every stage.

---

## 🏗️ Current Architecture — Hybrid Retrieval Pipeline

```
User Document (PDF / DOCX / TXT / URL / Text)
        │
        ▼
  [Upload / Ingest Routes — FastAPI]
  ├── Content-type validation by magic bytes, not just file extension
  ├── Background job created, status polled via /jobs/{id}
  ├── Sliding-window chunking (400 words, 50-word overlap)
  └── Dense embedding (fastembed, all-MiniLM-L6-v2, 384-dim, Redis-cached 24h)
        │
        ▼
  [Storage Layer — PostgreSQL + pgvector]
  ├── Users, refresh tokens, sessions, documents, document chunks, jobs,
  │   generations, verifications — 8 SQLAlchemy models, 4 Alembic migrations
  └── Row-level isolation by session_id, derived from the authenticated user
        │
        ▼
  [Hybrid Retrieval Layer]
  ├── Dense search: cosine distance over pgvector embeddings
  ├── Lexical search: BM25Okapi over the session's chunk set
  ├── Reciprocal rank fusion (k=60) merges both candidate lists
  ├── Cross-encoder reranking (Xenova/ms-marco-MiniLM-L-6-v2), toggleable
  └── Retrieval results cached in Redis, invalidated on ingest/delete
        │
        ▼
  [Generation Layer — Groq API, streamed]
  ├── GPT-OSS-120B, temperature 0.1, streamed as Server-Sent Events
  ├── System prompt enforces per-source bracketed citation markers [1][2]
  └── Per-error-type handling: auth, rate limit, timeout, connection failure
        │
        ▼
  [Verification Layer]
  ├── Answer split into declarative claims (list-marker-aware sentence splitter)
  ├── Each claim scored against retrieved chunks by significant-token overlap
  ├── Three-way label: supported (≥0.5) / uncertain (≥0.25) / unsupported
  └── Persisted per-generation, aggregated into a session grounding score
        │
        ▼
  [Frontend Workspace — Next.js 16, App Router]
  ├── JWT auth: short-lived access token held in memory, refresh token in an
  │   httpOnly cookie; route-level middleware gates protected pages on the
  │   refresh cookie's presence
  ├── Streamed token rendering, source-trace and evaluation dashboards
  └── Session analytics: request latency percentiles, cache hit rate, grounding trend
```

---

## ⚙️ Embedding and Retrieval

| Property | Value |
|---|---|
| Embedding model | `sentence-transformers/all-MiniLM-L6-v2` via `fastembed`, 384-dim |
| Reranker | `Xenova/ms-marco-MiniLM-L-6-v2` cross-encoder (`RERANKER_ENABLED`, on by default) |
| Vector store | PostgreSQL + `pgvector`, cosine distance, per-session filtering |
| Lexical search | `rank_bm25` (`BM25Okapi`) over the session's chunks, tokenised on `[a-z0-9]+` |
| Fusion | Reciprocal rank fusion, `k=60`, over dense + BM25 candidate lists (top_k × 3 each) |
| Chunk size | 400 words, 50-word overlap |
| Embedding cache | Redis, SHA-256(model + normalised text) key, 24h TTL |
| Retrieval cache | Redis, keyed on query + top_k + a document-set fingerprint, 15-minute TTL |
| Legacy retrieval mode | A simple threshold-filtered dense-only `search()` (score ≥ 0.45) still exists in `core/embedder.py` alongside `hybrid_search()` |

Reciprocal rank fusion means a chunk that ranks reasonably on both dense similarity and keyword overlap can outrank one that scores very high on only one signal — this is what lets the retriever handle both semantic queries ("what limits the model's generalisation") and exact-term queries ("what was the F1 score") without switching modes.

---

## 🤖 LLM Configuration

| Property | Value |
|---|---|
| Model | `openai/gpt-oss-120b` via Groq (`openai/gpt-oss-20b` also whitelisted) |
| Endpoint | `POST /api/v1/generate/`, streamed as `text/event-stream` (`retrieval` → `token`* → `done` events) |
| Temperature | 0.1 |
| Max tokens | 1024 |
| Timeouts | 30s to first token, 20s idle-stream timeout, 45s client timeout, 1 retry |
| Grounding | System prompt requires a bracketed source marker after every sourced fact, and forbids citing a source number beyond what was actually retrieved |
| Caching | Full generation responses cached in Redis for 1 hour, keyed on model + top_k + query |

If the Groq stream fails partway through, whatever tokens were already produced are still returned to the client with a `done` event rather than the connection dropping silently — the frontend always gets a terminal signal.

---

## 📄 Structured Summarisation

`POST /api/v1/summary/` truncates input to 12,000 characters and asks the LLM for strict JSON with five fields:

| Field | Description |
|---|---|
| `tldr` | Single-sentence summary (≤ 60 words) |
| `key_concepts` | 4–6 key technical terms |
| `methodology` | 2–3 sentences on research approach |
| `results` | 2–3 sentences on findings |
| `limitations` | 1–2 sentences on acknowledged gaps |

If the model's response isn't valid JSON, the endpoint falls back to a partially-filled summary with the raw text placed in `methodology` rather than failing the request outright.

---

## 🔐 Accounts, Sessions, and Security

- **JWT auth**: bcrypt password hashing, HS256 access tokens (30 min, held client-side in memory) and rotating refresh tokens (30 days, stored server-side by hash and set as an httpOnly cookie), register/login/refresh/logout/password-change endpoints.
- **Session scoping**: every document, chunk, job, generation, and verification is scoped to `session_id = f"user-{user.id}"`, enforced at the query level — there is no cross-user document listing endpoint.
- **Rate limiting** (`slowapi`, keyed by authenticated user id, falling back to IP): 5/min on auth endpoints, 10/min on uploads and text/URL ingest, 20/min on generation, 60/min on retrieval.
- **Request hardening**: a custom ASGI middleware enforces a request body size cap, a per-request timeout (streaming routes exempted), and attaches HSTS, `X-Content-Type-Options`, `X-Frame-Options`, and a restrictive CSP to every response.
- **Upload validation**: files are checked against their claimed extension by magic bytes (`%PDF-`, ZIP + `word/`, OLE header) before parsing, not just by filename suffix.
- **Startup fail-fast**: outside development, the app refuses to start if `GROQ_API_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`, or `REDIS_URL` are missing.
- **CORS**: explicit origin allow-list plus a regex allowing Vercel preview deployments (`https://prism(-[a-z0-9]+)*.vercel.app`).

---

## 📊 Two Evaluations, Two Architectures

**1. Manual evaluation of the original TF-IDF + FAISS system** (previously documented in `paper/Prism.pdf` — see Audit Notes; that file is not present in this repository snapshot): 45 manually authored queries against 12 arXiv preprints, with two independent human annotators for relevance judgements (Cohen's κ = 0.81). Under the default configuration (K=5, τ=0.45): a 96.7% groundedness rate, mean retrieval latency of 38±6ms (local, excluding the LLM call), and 1.9±0.5s end-to-end response time. Threshold-filtered TF-IDF beat a BM25 baseline by 8.5 points of Precision@K and 8.4 points of groundedness on a shared 30-query subset. The report also documents where that architecture broke: two abstention failures came from borderline chunks (cosine similarity 0.45–0.49) that shared surface vocabulary with the query without being substantively relevant — a limitation lexical/TF-IDF matching can't resolve on its own.

**2. Automated harness for the current hybrid-retrieval system** (`backend/eval/`): a 40-question dataset (`dataset.json`) run against 5 topic-diverse sample documents, computing Recall@5, Mean Reciprocal Rank, and a claim-level groundedness rate with 95% Wilson confidence intervals (`evaluate.py`), exposed via `GET /eval-report` and a re-run trigger at `POST /eval-report/run`. **No run has been persisted in this repository** — `eval/report.md` does not exist yet, so no accuracy number is claimed for the current architecture. The harness is real and tested; the number isn't filled in.

These two evaluations are not comparable to each other — different datasets, different metrics emphasis, different retrieval stacks — and this README does not present them as if they were.

---

## ✅ Testing

- **Backend**: 47 test functions across 7 files (`tests/`) covering embedding/chunking, hybrid retrieval, generation streaming, ingest, upload validation, and the health/metrics endpoints, using `pytest-asyncio`, `httpx.AsyncClient`, and factory fixtures (`factories.py`, `conftest.py`). CI runs these against real Postgres (`pgvector/pgvector:pg16`) and Redis service containers, gated at 65% coverage (`--cov-fail-under=65`) on `core` and `routes`.
- **Static analysis**: `ruff check .` and `mypy .` run in CI before tests.
- **Frontend unit/component tests**: `vitest` + Testing Library, covering UI primitives (`Button`, `Card`, `Input`), the `Sidebar` component, the API client, and the login page.
- **End-to-end tests**: Playwright specs for auth, navigation, ingestion, and the workspace flow, run headless in CI against a built app.
- **CI pipeline** (`.github/workflows/ci.yml`): three parallel jobs — backend tests, frontend lint/typecheck/build, frontend unit + e2e tests — on every push and pull request.
- **CD pipeline** (`.github/workflows/deploy.yml`): on a successful CI run on `main`, builds and pushes versioned backend and frontend Docker images to GitHub Container Registry.

---

## ⚠️ Limitations

- **No persisted benchmark for the current retrieval stack.** The hybrid dense+BM25+rerank pipeline has a working evaluation harness but no committed `eval/report.md` — the only published numbers (groundedness, P@K, latency) are for the earlier TF-IDF/FAISS version, and that report's source PDF is not currently checked into the repository (see Audit Notes).
- **Claim verification is lexical, not semantic.** `core/verifier.py` scores claims against context by significant-token overlap; a claim that paraphrases the source without sharing vocabulary can be marked unsupported even when it's accurate.
- **Reranker adds latency on every hybrid query** when `RERANKER_ENABLED=true`, since it scores every fused candidate synchronously before returning results.
- **Redis is a soft dependency for correctness but a hard one for performance.** Cache failures are caught and logged, not raised, so a Redis outage degrades to uncached (slower) retrieval and generation rather than failing requests — but that also means a misconfigured `REDIS_URL` fails silently rather than loudly.
- **Single free-tier deployment target.** `render.yaml` targets Render's free plan; background model warm-up and cold starts are visibly slower there than the CI environment.
- **No multi-tenant document sharing.** Session scoping is per-user only; there's no mechanism for two accounts to collaborate on the same document set.

---

## 🔭 Future Work

- Restore or regenerate the technical report backing the TF-IDF/FAISS evaluation, or remove the specific figures from this README if the source document isn't being kept in the repo going forward.
- Run the current evaluation harness end-to-end and commit `eval/report.md` so the hybrid-retrieval architecture has its own reported numbers, not just the legacy TF-IDF report.
- Replace lexical claim verification with a lightweight NLI or entailment model for semantic (not just lexical) grounding checks.
- Add shared/collaborative sessions so multiple accounts can query the same ingested document set.
- Persist OpenTelemetry traces to a hosted backend in production (currently wired for local Jaeger via `docker-compose.yml`, disabled by default via `OTEL_TRACES_ENABLED`).
- Extend the reranker and hybrid search benchmarking to quantify the latency/quality trade-off of `RERANKER_ENABLED` directly, the way the paper quantified the K/τ trade-off for the earlier architecture.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Zustand, TanStack Query |
| Frontend Testing | Vitest, Testing Library, Playwright |
| Backend | FastAPI, Uvicorn, Pydantic v2 / pydantic-settings |
| Database | PostgreSQL + `pgvector`, SQLAlchemy 2.0 (async), Alembic migrations |
| Cache / Rate Limiting | Redis, `slowapi` |
| Embeddings / Reranking | `fastembed` (all-MiniLM-L6-v2), `Xenova/ms-marco-MiniLM-L-6-v2` cross-encoder, `rank_bm25` |
| AI Inference | GPT-OSS-120B via Groq API |
| Auth | PyJWT, Passlib/bcrypt |
| Observability | OpenTelemetry (FastAPI + httpx instrumentation), Prometheus-format `/metrics`, structured request logging |
| Document Parsing | `pypdf`, `python-docx`, BeautifulSoup |
| CI/CD | GitHub Actions, Docker, GitHub Container Registry |
| Hosting | Vercel (frontend), Render (backend) |

---

## 🚀 Local Setup

**Prerequisites:** Docker & Docker Compose (recommended), or Node.js ≥ 20 + Python 3.11 + local Postgres/Redis. A Groq API key (free at [console.groq.com](https://console.groq.com)).

### Option A — Docker Compose (backend, frontend, Postgres, Redis, Jaeger)

```bash
git clone https://github.com/yamini-nlp/prism.git
cd prism
cp .env.example .env   # fill in GROQ_API_KEY at minimum
docker compose up --build
```

Backend: `http://localhost:8000` (docs at `/docs`) · Frontend: `http://localhost:3000` · Jaeger UI: `http://localhost:16686`

### Option B — Manual setup

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example`, setting at minimum:
```
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET_KEY=any_random_string_for_local_dev
DATABASE_URL=postgresql+asyncpg://prism:prism@localhost:5432/prism
REDIS_URL=redis://localhost:6379/0
```

```bash
uvicorn main:app --reload --port 8000
```
Alembic migrations run automatically on startup.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Tests:**
```bash
# Backend
cd backend && pytest --cov=core --cov=routes

# Frontend unit tests
cd frontend && npm run test

# Frontend e2e (requires the app running)
cd frontend && npm run e2e
```

---

## 📁 Repository Structure

```
prism/
├── backend/
│   ├── main.py                    # FastAPI app, middleware, jobs/documents endpoints, health/metrics
│   ├── core/
│   │   ├── embedder.py            # Chunking, dense embedding, BM25, RRF fusion, reranking, document CRUD
│   │   ├── rag.py                 # Streamed RAG generation, SSE events, Groq error handling
│   │   ├── verifier.py            # Claim splitting and token-overlap grounding verification
│   │   ├── auth.py / security.py  # Current-user dependency, JWT + password hashing
│   │   ├── models.py              # SQLAlchemy models: User, RefreshToken, Session, Document,
│   │   │                          # DocumentChunk, Job, Generation, Verification
│   │   ├── config.py              # Pydantic settings, env validation, CORS origin logic
│   │   ├── db.py / cache.py       # Async Postgres session factory, Redis cache helpers
│   │   ├── jobs.py                # Background job state machine
│   │   ├── limiter.py             # slowapi rate-limit configuration
│   │   ├── metrics.py / tracing.py / logging_config.py / errors.py
│   │   └── schemas.py             # Pydantic request/response models
│   ├── routes/
│   │   ├── auth.py                # register / login / refresh / logout / me / password
│   │   ├── upload.py              # PDF/DOCX/DOC/TXT upload, magic-byte validation
│   │   ├── ingest.py               # Raw text and URL ingestion
│   │   ├── retrieve.py            # Hybrid retrieval endpoint, Redis-cached
│   │   ├── generate.py            # Streamed generation endpoint, Redis-cached
│   │   ├── summary.py             # Structured document summarisation
│   │   ├── verify.py              # Standalone claim verification endpoint
│   │   └── analytics.py           # Session-level aggregate metrics
│   ├── eval/
│   │   ├── evaluate.py            # Recall@5 / MRR / groundedness harness with Wilson CIs
│   │   ├── dataset.json           # 40-question evaluation set
│   │   └── sample_docs/           # 5 topic-diverse evaluation documents
│   ├── alembic/versions/          # 4 migrations: initial schema, auth, job stage, document library fields
│   ├── tests/                     # 47 tests across 7 files, pytest-asyncio + factories
│   └── requirements.txt
├── frontend/
│   ├── src/app/                   # Next.js App Router: dashboard, workspace, library, ingest,
│   │                               # source-trace, verification, evaluation, settings, login, register
│   ├── src/components/            # Sidebar, Topbar, AuthGate, CitationPopover, ConfidenceBadge, ui/
│   ├── src/lib/                   # API client, auth, query hooks (TanStack Query), Zod validation
│   ├── src/middleware.ts          # Route-level auth guard via refresh-token cookie
│   ├── e2e/                       # Playwright specs: auth, navigation, ingest, workspace
│   └── package.json
├── paper/
│   └── Prism.pdf                  # Technical report on the original TF-IDF + FAISS architecture
│                                   # (currently not tracked in this repository — see Audit Notes)
├── .github/workflows/
│   ├── ci.yml                     # Backend tests + coverage gate, frontend lint/typecheck/build/e2e
│   └── deploy.yml                 # Build and push Docker images on successful main-branch CI
├── docker-compose.yml             # Postgres, Redis, Jaeger, backend, frontend
├── render.yaml                    # Render deployment config for the backend
└── README.md
```

---
<div align="center">
        
*Built by Yamini G · [Live Demo](https://prism-nine-tau.vercel.app)*

</div>
