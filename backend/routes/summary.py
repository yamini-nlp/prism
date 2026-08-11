from fastapi import APIRouter, Request, Depends
from groq import Groq
import os
import json
from dotenv import load_dotenv
from core.auth import get_current_user
from core.models import User
from core.limiter import limiter
from core.errors import ValidationAppError
from core import schemas

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

@router.post(
    "/",
    response_model=schemas.SummaryResponse,
    summary="Summarize a document",
    description="Generate a structured summary (tldr, key concepts, methodology, results, limitations) for a document's text.",
)
@limiter.limit("20/minute")
async def summarize(request: Request, body: schemas.SummaryRequest, current_user: User = Depends(get_current_user)):
    if len(body.text.strip()) < 100:
        raise ValidationAppError("Text too short to summarize.")

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

    content = response.choices[0].message.content
    if content is None:
        raise ValidationAppError("Summarization model returned an empty response.")
    raw = content.strip()
    
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

    return schemas.SummaryResponse(source=body.source, summary=schemas.SummaryResult(**summary))
