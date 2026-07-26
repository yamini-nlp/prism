import uuid

import pytest

from core import embedder
from core.db import ensure_session


def test_chunk_text_splits_long_text_into_multiple_chunks():
    text = "word " * 1000
    chunks = embedder.chunk_text(text, chunk_size=100, overlap=10)
    assert len(chunks) > 1
    assert all(len(c) > 30 for c in chunks)


def test_chunk_text_filters_out_short_chunks():
    chunks = embedder.chunk_text("short")
    assert chunks == []


async def test_embed_and_store_and_hybrid_search(db_session):
    session_id = f"test-embedder-{uuid.uuid4().hex[:10]}"
    await ensure_session(db_session, session_id)
    try:
        chunks = embedder.chunk_text(
            "The quick brown fox jumps over the lazy dog in a sunny meadow near the river."
        )
        count = await embedder.embed_and_store(db_session, chunks, source="fox.txt", session_id=session_id)
        assert count == len(chunks)

        results = await embedder.hybrid_search(db_session, "quick brown fox", session_id, top_k=3)
        assert len(results) >= 1
        assert results[0]["source"] == "fox.txt"
    finally:
        await embedder.reset_storage(db_session, session_id)


async def test_hybrid_search_on_empty_index_returns_empty_list(db_session):
    session_id = f"test-embedder-empty-{uuid.uuid4().hex[:10]}"
    await ensure_session(db_session, session_id)
    results = await embedder.hybrid_search(db_session, "anything at all", session_id, top_k=5)
    assert results == []


async def test_search_on_empty_index_returns_empty_list(db_session):
    session_id = f"test-embedder-empty2-{uuid.uuid4().hex[:10]}"
    await ensure_session(db_session, session_id)
    results = await embedder.search(db_session, "anything at all", session_id, top_k=5)
    assert results == []


async def test_embed_and_store_with_no_chunks_returns_zero(db_session):
    session_id = f"test-embedder-no-chunks-{uuid.uuid4().hex[:10]}"
    await ensure_session(db_session, session_id)
    count = await embedder.embed_and_store(db_session, [], source="empty.txt", session_id=session_id)
    assert count == 0


async def test_embed_and_store_multiple_chunks(db_session):
    session_id = f"test-embedder-multi-{uuid.uuid4().hex[:10]}"
    await ensure_session(db_session, session_id)
    try:
        text = "sentence about deep learning architectures and optimization techniques. " * 60
        chunks = embedder.chunk_text(text)
        count = await embedder.embed_and_store(db_session, chunks, source="multi.txt", session_id=session_id)
        assert count == len(chunks)
        assert count > 1
    finally:
        await embedder.reset_storage(db_session, session_id)


async def test_reset_storage_clears_chunks(db_session):
    session_id = f"test-embedder-reset-{uuid.uuid4().hex[:10]}"
    await ensure_session(db_session, session_id)
    chunks = embedder.chunk_text(
        "Deep learning models require large datasets and significant compute resources to train effectively."
    )
    await embedder.embed_and_store(db_session, chunks, source="dl.txt", session_id=session_id)
    await embedder.reset_storage(db_session, session_id)
    results = await embedder.hybrid_search(db_session, "deep learning", session_id, top_k=5)
    assert results == []


async def test_invalid_session_id_raises_value_error(db_session):
    with pytest.raises(ValueError):
        await embedder.hybrid_search(db_session, "query", "invalid session id!!", top_k=5)


async def test_get_documents_reflects_seeded_document(db_session):
    from tests.factories import create_document_with_chunk, create_user_with_session
    user, session_id = await create_user_with_session(db_session)
    await create_document_with_chunk(db_session, session_id)
    docs = await embedder.get_documents(db_session, session_id)
    assert len(docs) == 1
    assert docs[0]["chunk_count"] == 1