import os


def test_retrieve_empty_index(client, auth_headers):
    response = client.get("/retrieve/", headers=auth_headers, params={"query": "anything at all"})
    assert response.status_code == 200
    data = response.json()
    assert data["results"] == []
    assert data["count"] == 0


def test_retrieve_success_after_ingest(client, auth_headers):
    body = {
        "text": "Photosynthesis converts light energy into chemical energy stored in glucose within chloroplasts.",
        "source": "bio.txt",
    }
    ingest_response = client.post("/ingest/text", headers=auth_headers, json=body)
    job_id = ingest_response.json()["job_id"]
    client.get(f"/jobs/{job_id}")

    response = client.get("/retrieve/", headers=auth_headers, params={"query": "photosynthesis chloroplasts"})
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    assert data["results"][0]["source"] == "bio.txt"


def test_retrieve_missing_session_header(client):
    headers = {"x-api-key": os.environ["APP_API_KEY"]}
    response = client.get("/retrieve/", headers=headers, params={"query": "test"})
    assert response.status_code == 422


def test_retrieve_missing_api_key(client):
    response = client.get("/retrieve/", headers={"x-session-id": "test-session"}, params={"query": "test"})
    assert response.status_code == 401