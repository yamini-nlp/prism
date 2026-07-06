import json
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("APP_API_KEY", "test-api-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("DATA_DIR", str(Path(__file__).resolve().parent / "test_data"))
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from main import app
from core import embedder

TEST_SESSION_ID = "test-session"
TEST_API_KEY = os.environ["APP_API_KEY"]


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_test_storage():
    embedder.reset_storage(TEST_SESSION_ID)
    yield
    embedder.reset_storage(TEST_SESSION_ID)


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


@pytest.fixture
def auth_headers():
    return {"x-api-key": TEST_API_KEY, "x-session-id": TEST_SESSION_ID}