import os


def test_ingest_text_success(client, auth_headers):
    body = {
        "text": "This is a sufficiently long piece of text to ingest for testing retrieval later on today.",
        "source": "Test Source",
    }
    response = client.post("/ingest/text", headers=auth_headers, json=body)
    assert response.status_code == 202
    job_id = response.json()["job_id"]

    job = client.get(f"/jobs/{job_id}").json()
    assert job["status"] == "complete"
    assert job["result"]["chunks_created"] >= 1


def test_ingest_text_empty(client, auth_headers):
    body = {"text": "", "source": "Test"}
    response = client.post("/ingest/text", headers=auth_headers, json=body)
    assert response.status_code == 400


def test_ingest_text_too_short(client, auth_headers):
    body = {"text": "short text", "source": "Test"}
    response = client.post("/ingest/text", headers=auth_headers, json=body)
    assert response.status_code == 400


def test_ingest_missing_session_header(client):
    headers = {"x-api-key": os.environ["APP_API_KEY"]}
    body = {"text": "A" * 60, "source": "Test"}
    response = client.post("/ingest/text", headers=headers, json=body)
    assert response.status_code == 422


def test_ingest_missing_api_key(client):
    body = {"text": "A" * 60, "source": "Test"}
    response = client.post("/ingest/text", headers={"x-session-id": "test-session"}, json=body)
    assert response.status_code == 401