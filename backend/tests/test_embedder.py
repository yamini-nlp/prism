import pytest
from core import embedder
def test_chunk_text_splits_long_text_into_multiple_chunks():
    text = "word " * 1000
    chunks = embedder.chunk_text(text, chunk_size=100, overlap=10)
    assert len(chunks) > 1
    assert all(len(c) > 30 for c in chunks)
def test_chunk_text_filters_out_short_chunks():
    chunks = embedder.chunk_text("short")
    assert chunks == []
def test_embed_and_store_and_hybrid_search():
    session_id = "test-embedder-session"
    embedder.reset_storage(session_id)
    try:
        chunks = embedder.chunk_text(
            "The quick brown fox jumps over the lazy dog in a sunny meadow near the river."
        )
        count = embedder.embed_and_store(chunks, source="fox.txt", session_id=session_id)
        assert count == len(chunks)

        results = embedder.hybrid_search("quick brown fox", session_id, top_k=3)
        assert len(results) >= 1
        assert results[0]["source"] == "fox.txt"
    finally:
        embedder.reset_storage(session_id)
def test_hybrid_search_on_empty_index_returns_empty_list():
    session_id = "test-embedder-empty-session"
    embedder.reset_storage(session_id)
    results = embedder.hybrid_search("anything at all", session_id, top_k=5)
    assert results == []
def test_search_on_empty_index_returns_empty_list():
    session_id = "test-embedder-empty-session-2"
    embedder.reset_storage(session_id)
    results = embedder.search("anything at all", session_id, top_k=5)
    assert results == []
def test_embed_and_store_oversized_input():
    session_id = "test-embedder-oversized"
    embedder.reset_storage(session_id)
    try:
        huge_text = "word " * 50000
        chunks = embedder.chunk_text(huge_text)
        count = embedder.embed_and_store(chunks, source="huge.txt", session_id=session_id)
        assert count == len(chunks)
        assert count > 1
    finally:
        embedder.reset_storage(session_id)
def test_embed_and_store_with_no_chunks_returns_zero():
    session_id = "test-embedder-no-chunks"
    embedder.reset_storage(session_id)
    count = embedder.embed_and_store([], source="empty.txt", session_id=session_id)
    assert count == 0
def test_invalid_session_id_raises_value_error():
    with pytest.raises(ValueError):
        embedder.hybrid_search("query", "invalid session id!!", top_k=5)