from fastapi import APIRouter, Request, Depends
from groq import AsyncGroq
import json
import logging
from core.auth import get_current_user
from core.models import User
from core.limiter import limiter
from core.config import settings
from core.errors import ValidationAppError, AppError
from core import schemas

router = APIRouter()
logger = logging.getLogger("prism")
client = AsyncGroq(api_key=settings.groq_api_key, timeout=30.0, max_retries=1)

SUMMARY_MODEL = "openai/gpt-oss-120b"

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

    try:
        response = await client.chat.completions.create(
            model=SUMMARY_MODEL,
            messages=[
                {"role": "system", "content": SUMMARY_PROMPT},
                {"role": "user", "content": f"Document: {body.source}\n\nText:\n{truncated}"},
            ],
            temperature=0.2,
            max_tokens=800,
        )
    except Exception as exc:
        # Without this, a Groq-side failure (bad/expired key, decommissioned
        # model, rate limit, network blip) raises past this function
        # uncaught. FastAPI's generic exception handler still returns a
        # JSON 500, but browsers report a response that errors out before
        # CORS headers are visible to JS as an opaque "CORS policy" /
        # net::ERR_FAILED failure, which is misleading. Converting it into
        # an AppError keeps it inside the normal, CORS-safe error envelope.
        logger.exception("groq summarization request failed")
        raise AppError(
            "Failed to generate a summary right now. Please try again in a moment.",
            code="summary_generation_failed",
            status_code=502,
        ) from exc

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
