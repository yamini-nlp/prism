from groq import Groq
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

VERIFY_PROMPT = """You are a research verification assistant. Given an answer and a set of source context chunks, identify each factual claim in the answer and determine whether it is:
- "grounded": Directly supported by the source context
- "partial": Partially supported but with gaps or approximations
- "ungrounded": Not supported by any source — likely hallucinated

Respond ONLY with a JSON array of objects, each with:
- "claim": the exact claim text
- "status": "grounded" | "partial" | "ungrounded"
- "source": the source reference if grounded/partial, or null
- "explanation": a brief explanation

Do not include any preamble or markdown fences. Only valid JSON."""

def verify_answer(answer: str, context_chunks: list[dict]) -> list[dict]:
    context = "\n\n".join(
        f"[{c['source']}]: {c['chunk']}" for c in context_chunks
    )

    prompt = f"""Answer to verify:
\"\"\"{answer}\"\"\"

Source context:
\"\"\"{context}\"\"\"

Identify and classify each factual claim:"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": VERIFY_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.0,
        max_tokens=1500,
    )

    raw = response.choices[0].message.content.strip()

    try:
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        claims = json.loads(cleaned)
        return claims
    except Exception:
        return [
            {
                "claim": answer[:200],
                "status": "partial",
                "source": None,
                "explanation": "Could not parse individual claims. Manual review recommended.",
            }
        ]