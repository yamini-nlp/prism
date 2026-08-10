async def test_retrieve_empty_index(client, auth_headers):
    response = await client.get("/api/v1/retrieve/", headers=auth_headers, params={"query": "anything at all"})
    assert response.status_code == 200
    data = response.json()
    assert data["results"] == []
    assert data["count"] == 0


async def test_retrieve_success_after_ingest(client, auth_headers):
    body = {
        "text": "Photosynthesis converts light energy into chemical energy stored in glucose within chloroplasts.",
        "source": "bio.txt",
    }
    ingest_response = await client.post("/api/v1/ingest/text", headers=auth_headers, json=body)
    job_id = ingest_response.json()["job_id"]
    await client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)

    response = await client.get("/api/v1/retrieve/", headers=auth_headers, params={"query": "photosynthesis chloroplasts"})
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    assert data["results"][0]["source"] == "bio.txt"


async def test_retrieve_missing_auth_token(client):
    response = await client.get("/api/v1/retrieve/", params={"query": "test"})
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "http_error"


async def test_retrieve_invalid_top_k_rejected(client, auth_headers):
    response = await client.get("/api/v1/retrieve/", headers=auth_headers, params={"query": "test", "top_k": 0})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


async def test_retrieve_cache_hit_after_first_miss(client, auth_headers, monkeypatch):
    hits = []
    misses = []
    monkeypatch.setattr("routes.retrieve.record_cache_hit", lambda key: hits.append(key))
    monkeypatch.setattr("routes.retrieve.record_cache_miss", lambda key: misses.append(key))

    body = {
        "text": "Mitochondria are the powerhouse of the cell and generate ATP through cellular respiration.",
        "source": "cell.txt",
    }
    ingest_response = await client.post("/api/v1/ingest/text", headers=auth_headers, json=body)
    job_id = ingest_response.json()["job_id"]
    await client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)

    first = await client.get("/api/v1/retrieve/", headers=auth_headers, params={"query": "mitochondria cellular respiration"})
    second = await client.get("/api/v1/retrieve/", headers=auth_headers, params={"query": "mitochondria cellular respiration"})

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["results"] == second.json()["results"]
    assert len(misses) >= 1
    assert len(hits) >= 1


async def test_user_cannot_retrieve_another_users_documents(client, auth_headers, second_auth_headers):
    body = {
        "text": "This confidential passage should remain scoped to the first user's session only.",
        "source": "private.txt",
    }
    ingest_response = await client.post("/api/v1/ingest/text", headers=auth_headers, json=body)
    job_id = ingest_response.json()["job_id"]
    await client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)

    other_user_response = await client.get(
        "/api/v1/retrieve/", headers=second_auth_headers, params={"query": "confidential passage session"}
    )
    assert other_user_response.status_code == 200
    assert other_user_response.json()["count"] == 0

    other_user_docs = await client.get("/api/v1/documents/", headers=second_auth_headers)
    assert other_user_docs.status_code == 200
    assert other_user_docs.json() == []

    owner_docs = await client.get("/api/v1/documents/", headers=auth_headers)
    assert owner_docs.status_code == 200
    assert len(owner_docs.json()) >= 1
