import asyncio
import json
import os
import sys
import uuid
from pathlib import Path
from unittest.mock import MagicMock

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("APP_API_KEY", "test-api-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-for-ci-only")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://prism:prism@localhost:5432/prism_test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/1")
os.environ.setdefault("OTEL_TRACES_ENABLED", "false")
os.environ.setdefault("DATA_DIR", str(Path(__file__).resolve().parent / "test_data"))

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from main import app
from core.db import AsyncSessionLocal, init_db, engine
from core.limiter import limiter

TEST_PASSWORD = "SuperSecret123!"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _initialize_database():
    await init_db()
    yield
    await engine.dispose()


@pytest.fixture(autouse=True)
def _reset_rate_limiter_state():
    limiter.reset()
    yield
    limiter.reset()


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


def _fake_chat_completion(*args, **kwargs):
    if kwargs.get("stream"):
        def token_stream():
            chunk = MagicMock()
            delta = MagicMock()
            delta.content = "This is a mocked grounded answer."
            choice = MagicMock()
            choice.delta = delta
            chunk.choices = [choice]
            yield chunk
        return token_stream()

    response = MagicMock()
    message = MagicMock()
    message.content = json.dumps({
        "tldr": "Mocked summary.",
        "key_concepts": ["concept one", "concept two"],
        "methodology": "Mocked methodology.",
        "results": "Mocked results.",
        "limitations": "Mocked limitations.",
    })
    response.choices = [MagicMock(message=message)]
    return response


@pytest.fixture(autouse=True)
def mock_groq(monkeypatch):
    fake_create = MagicMock(side_effect=_fake_chat_completion)
    monkeypatch.setattr("core.rag.client.chat.completions.create", fake_create)
    monkeypatch.setattr("routes.summary.client.chat.completions.create", fake_create)
    yield fake_create


def _unique_email() -> str:
    return f"user-{uuid.uuid4().hex[:12]}@example.com"


@pytest_asyncio.fixture
async def register_user(client):
    async def _register(password: str = TEST_PASSWORD):
        email = _unique_email()
        response = await client.post("/api/v1/auth/register", json={"email": email, "password": password})
        assert response.status_code == 200
        return response.json()
    return _register


@pytest_asyncio.fixture
async def registered_user(register_user):
    return await register_user()


@pytest_asyncio.fixture
async def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['access_token']}"}


@pytest_asyncio.fixture
async def second_registered_user(register_user):
    return await register_user()


@pytest_asyncio.fixture
async def second_auth_headers(second_registered_user):
    return {"Authorization": f"Bearer {second_registered_user['access_token']}"}
ff