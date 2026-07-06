import os
import sys
import json
import math
import statistics
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv

load_dotenv(BACKEND_DIR / ".env")

from core.embedder import chunk_text, embed_and_store, hybrid_search, reset_storage, init_storage
from core.rag import stream_rag

EVAL_DIR = Path(__file__).resolve().parent
SAMPLE_DOCS_DIR = EVAL_DIR / "sample_docs"
DATASET_PATH = EVAL_DIR / "dataset.json"
REPORT_PATH = EVAL_DIR / "report.md"
SESSION_ID = "eval-session"


def wilson_ci(successes: int, n: int, z: float = 1.96):
    if n == 0:
        return (0.0, 0.0)
    phat = successes / n
    denom = 1 + (z ** 2) / n
    center = phat + (z ** 2) / (2 * n)
    margin = z * math.sqrt((phat * (1 - phat) / n) + (z ** 2 / (4 * n ** 2)))
    lower = (center - margin) / denom
    upper = (center + margin) / denom
    return (max(0.0, lower), min(1.0, upper))


def ingest_sample_docs():
    reset_storage(SESSION_ID)
    init_storage(SESSION_ID)
    doc_paths = sorted(SAMPLE_DOCS_DIR.glob("*.txt"))
    if not doc_paths:
        raise RuntimeError(f"No sample docs found in {SAMPLE_DOCS_DIR}")
    for path in doc_paths:
        text = path.read_text(encoding="utf-8")
        chunks = chunk_text(text)
        embed_and_store(chunks, source=path.name, session_id=SESSION_ID, source_type="text", title=path.stem)
    return [p.name for p in doc_paths]


def compute_recall_and_mrr(results, expected_source):
    sources = [r["source"] for r in results]
    if expected_source in sources:
        rank = sources.index(expected_source) + 1
        return True, 1.0 / rank, rank
    return False, 0.0, None


def run_generation(query: str):
    answer = ""
    grounding = []
    for event in stream_rag(query, SESSION_ID, top_k=5):
        if "event: done" not in event:
            continue
        for line in event.splitlines():
            if line.startswith("data:"):
                payload = json.loads(line[len("data:"):].strip())
                answer = payload.get("answer", "")
                grounding = payload.get("grounding", [])
    total_claims = len(grounding)
    supported = sum(1 for g in grounding if g.get("label") == "supported")
    return answer, total_claims, supported


def write_report(rows, n, recall_hits, recall_at_5, recall_ci, mean_mrr,
                  total_claims_all, supported_claims_all, groundedness_rate, ground_ci):
    lines = []
    lines.append("# Prism Evaluation Report")
    lines.append("")
    lines.append(f"Questions evaluated: {n}")
    lines.append("")
    lines.append("## Per-Question Results")
    lines.append("")
    lines.append("| # | Question | Expected Source | Hit@5 | Rank | RR | Claims | Supported | Supported % |")
    lines.append("|---|----------|------------------|-------|------|----|--------|-----------|--------------|")
    for row in rows:
        question_escaped = row["question"].replace("|", "\\|")
        lines.append(
            f"| {row['index']} | {question_escaped} | {row['expected_source']} | "
            f"{'yes' if row['recall_hit'] else 'no'} | {row['rank']} | {row['mrr']} | "
            f"{row['total_claims']} | {row['supported_claims']} | {row['supported_rate']}% |"
        )
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append(
        f"- **Recall@5**: {recall_hits}/{n} = {recall_at_5 * 100:.1f}% "
        f"(95% Wilson CI: {recall_ci[0] * 100:.1f}% - {recall_ci[1] * 100:.1f}%)"
    )
    lines.append(f"- **Mean Reciprocal Rank (MRR)**: {mean_mrr:.3f}")
    lines.append(
        f"- **Groundedness rate**: {supported_claims_all}/{total_claims_all} claims supported = "
        f"{groundedness_rate * 100:.1f}% "
        f"(95% Wilson CI: {ground_ci[0] * 100:.1f}% - {ground_ci[1] * 100:.1f}%)"
    )
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    if not os.getenv("GROQ_API_KEY"):
        print("ERROR: GROQ_API_KEY not set. Add it to backend/.env before running the eval.")
        sys.exit(1)

    with open(DATASET_PATH, encoding="utf-8") as f:
        dataset = json.load(f)

    print(f"Ingesting sample docs into session '{SESSION_ID}'...")
    ingested = ingest_sample_docs()
    print(f"Ingested: {', '.join(ingested)}")

    rows = []
    recall_hits = 0
    total_claims_all = 0
    supported_claims_all = 0
    mrr_values = []

    for i, item in enumerate(dataset, start=1):
        question = item["question"]
        expected_source = item["expected_source"]

        print(f"[{i}/{len(dataset)}] {question}")

        results = hybrid_search(question, SESSION_ID, top_k=5)
        hit, mrr, rank = compute_recall_and_mrr(results, expected_source)
        recall_hits += int(hit)
        mrr_values.append(mrr)

        answer, total_claims, supported = run_generation(question)
        total_claims_all += total_claims
        supported_claims_all += supported
        supported_rate = (supported / total_claims * 100) if total_claims else 0.0

        rows.append({
            "index": i,
            "question": question,
            "expected_source": expected_source,
            "recall_hit": hit,
            "rank": rank if rank else "-",
            "mrr": round(mrr, 3),
            "generated_answer": answer,
            "total_claims": total_claims,
            "supported_claims": supported,
            "supported_rate": round(supported_rate, 1),
        })

    n = len(dataset)
    recall_at_5 = recall_hits / n if n else 0.0
    mean_mrr = statistics.mean(mrr_values) if mrr_values else 0.0
    recall_ci = wilson_ci(recall_hits, n)

    groundedness_rate = (supported_claims_all / total_claims_all) if total_claims_all else 0.0
    ground_ci = wilson_ci(supported_claims_all, total_claims_all)

    write_report(rows, n, recall_hits, recall_at_5, recall_ci, mean_mrr,
                 total_claims_all, supported_claims_all, groundedness_rate, ground_ci)

    print(f"\nRecall@5: {recall_hits}/{n} ({recall_at_5 * 100:.1f}%), 95% CI [{recall_ci[0] * 100:.1f}%, {recall_ci[1] * 100:.1f}%]")
    print(f"Mean MRR: {mean_mrr:.3f}")
    print(
        f"Groundedness: {supported_claims_all}/{total_claims_all} "
        f"({groundedness_rate * 100:.1f}%), 95% CI [{ground_ci[0] * 100:.1f}%, {ground_ci[1] * 100:.1f}%]"
    )
    print(f"Report written to {REPORT_PATH}")


if __name__ == "__main__":
    main()