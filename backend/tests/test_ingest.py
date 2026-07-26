async def test_ingest_text_success(client, auth_headers):
    body = {
        "text": "This is a sufficiently long piece of text to ingest for testing retrieval later on today.",
        "source": "Test Source",
    }
    response = await client.post("/api/v1/ingest/text", headers=auth_headers, json=body)
    assert response.status_code == 202
    job_id = response.json()["job_id"]

    job = (await client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)).json()
    assert job["status"] == "complete"
    assert job["result"]["chunks_created"] >= 1


async def test_ingest_text_empty(client, auth_headers):
    body = {"text": "", "source": "Test"}
    response = await client.post("/api/v1/ingest/text", headers=auth_headers, json=body)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


async def test_ingest_text_too_short(client, auth_headers):
    body = {"text": "short text", "source": "Test"}
    response = await client.post("/api/v1/ingest/text", headers=auth_headers, json=body)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


async def test_ingest_invalid_body_shape_rejected(client, auth_headers):
    response = await client.post("/api/v1/ingest/text", headers=auth_headers, json={"source": "Test"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


async def test_ingest_missing_auth_token(client):
    body = {"text": "A" * 60, "source": "Test"}
    response = await client.post("/api/v1/ingest/text", json=body)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "http_error"


async def test_ingest_url_success_triggers_job(client, auth_headers):
    body = {"url": "https://example.com/not-fetched-in-tests"}
    response = await client.post("/api/v1/ingest/url", headers=auth_headers, json=body)
    assert response.status_code == 202
    assert "job_id" in response.json()