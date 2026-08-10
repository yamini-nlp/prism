import uuid

from core.models import Document, DocumentChunk, Job, Session as SessionModel, User
from core.security import hash_password

EMBEDDING_DIM = 384
DEFAULT_TEST_PASSWORD = "SuperSecret123!"


def make_user_registration_payload(password: str = DEFAULT_TEST_PASSWORD) -> dict:
    return {
        "email": f"factory-{uuid.uuid4().hex[:12]}@example.com",
        "password": password,
    }


def make_text_ingest_payload(prefix: str = "Document") -> dict:
    return {
        "text": (
            f"{prefix} content discussing important research findings across multiple domains "
            "including methodology, results, and future directions for continued investigation."
        ),
        "source": f"{prefix.lower()}.txt",
    }


def make_generate_payload(query: str = "What is this about?", top_k: int = 5) -> dict:
    return {"query": query, "top_k": top_k}


def make_verify_payload(answer: str, context_chunks: list) -> dict:
    return {"answer": answer, "context_chunks": context_chunks}


async def create_user_with_session(db, password: str = DEFAULT_TEST_PASSWORD):
    email = f"factory-{uuid.uuid4().hex[:12]}@example.com"
    user = User(email=email, hashed_password=hash_password(password))
    db.add(user)
    await db.flush()
    session_id = f"user-{user.id}"
    db.add(SessionModel(id=session_id))
    await db.commit()
    return user, session_id


async def create_document_with_chunk(db, session_id: str, source: str = "factory.txt",
                                      chunk_text_value: str = "Factory generated content chunk used for testing purposes."):
    document = Document(
        session_id=session_id,
        title=source[:60],
        source=source,
        source_type="text",
        chunk_count=1,
        chunk_start_index=0,
    )
    db.add(document)
    await db.flush()
    chunk = DocumentChunk(
        document_id=document.id,
        session_id=session_id,
        source=source,
        chunk=chunk_text_value,
        chunk_index=0,
        embedding=[0.0] * EMBEDDING_DIM,
    )
    db.add(chunk)
    await db.commit()
    return document, chunk


async def create_pending_job(db, session_id: str):
    job = Job(id=uuid.uuid4(), session_id=session_id, status="pending", result=None, error=None)
    db.add(job)
    await db.commit()
    return job
