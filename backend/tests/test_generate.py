async def test_generate_no_documents(client, auth_headers):
    body = {"query": "What is this about?", "top_k": 5}
    response = await client.post("/api/v1/generate/", headers=auth_headers, json=body)
    assert response.status_code == 200
    assert "No relevant documents found" in response.text


async def test_generate_empty_query(client, auth_headers):
    body = {"query": "   ", "top_k": 5}
    response = await client.post("/api/v1/generate/", headers=auth_headers, json=body)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


async def test_generate_success_with_documents(client, auth_headers, mock_groq):
    ingest_body = {
        "text": "Quantum computers use qubits which can exist in superposition of zero and one simultaneously.",
        "source": "qc.txt",
    }
    ingest_response = await client.post("/api/v1/ingest/text", headers=auth_headers, json=ingest_body)
    job_id = ingest_response.json()["job_id"]
    await client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)

    body = {"query": "What is a qubit?", "top_k": 5}
    response = await client.post("/api/v1/generate/", headers=auth_headers, json=body)
    assert response.status_code == 200
    assert "event: done" in response.text
    assert mock_groq.called


async def test_generate_missing_auth_token(client):
    response = await client.post("/api/v1/generate/", json={"query": "test"})
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "http_error"


async def test_generate_invalid_bearer_token_rejected(client):
    headers = {"Authorization": "Bearer garbage-token-value"}
    response = await client.post("/api/v1/generate/", headers=headers, json={"query": "test"})
    assert response.status_code == 401


async def test_generate_cache_hit_on_repeat_query(client, auth_headers, monkeypatch):
    hits = []
    misses = []
    monkeypatch.setattr("routes.generate.record_cache_hit", lambda key: hits.append(key))
    monkeypatch.setattr("routes.generate.record_cache_miss", lambda key: misses.append(key))

    ingest_body = {
        "text": "Neural networks learn representations through layers of weighted connections and activations.",
        "source": "nn.txt",
    }
    ingest_response = await client.post("/api/v1/ingest/text", headers=auth_headers, json=ingest_body)
    job_id = ingest_response.json()["job_id"]
    await client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)

    body = {"query": "How do neural networks learn?", "top_k": 5}
    first = await client.post("/api/v1/generate/", headers=auth_headers, json=body)
    second = await client.post("/api/v1/generate/", headers=auth_headers, json=body)

    assert first.status_code == 200
    assert second.status_code == 200
    assert len(misses) >= 1
    assert len(hits) >= 1
