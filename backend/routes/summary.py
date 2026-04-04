from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from groq import Groq
import os
import json
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SUMMARY_PROMPT = """You are a research summarization assistant. Given the text of a research document, produce a structured JSON summary with these exact keys:

- "tldr": A single sentence summary of the paper (max 60 words)
- "key_concepts": A list of 4-6 key technical concepts or terms (strings only)
- "methodology": 2-3 sentences describing the research methodology
- "results": 2-3 sentences describing the key results and findings
- "limitations": 1-2 sentences describing the study's limitations

Respond ONLY with valid JSON. No preamble, no markdown fences."""

class SummaryRequest(BaseModel):
    text: str
    source: str = "Document"

@router.post("/")
async def summarize(body: SummaryRequest):
    if len(body.text.strip()) < 100:
        raise HTTPException(status_code=400, detail="Text too short to summarize.")

    truncated = body.text[:12000]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SUMMARY_PROMPT},
            {"role": "user", "content": f"Document: {body.source}\n\nText:\n{truncated}"},
        ],
        temperature=0.2,
        max_tokens=800,
    )

    raw = response.choices[0].message.content.strip()

    try:
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        summary = json.loads(cleaned)
    except Exception:
        summary = {
            "tldr": "Summary could not be parsed. Please review manually.",
            "key_concepts": [],
            "methodology": raw[:300],
            "results": "",
            "limitations": "",
        }

    return JSONResponse({
        "source": body.source,
        "summary": summary,
    })