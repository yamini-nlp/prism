import os


def test_generate_no_documents(client, auth_headers):
    body = {"query": "What is this about?", "top_k": 5}
    response = client.post("/generate/", headers=auth_headers, json=body)
    assert response.status_code == 200
    assert "No relevant documents found" in response.text


def test_generate_empty_query(client, auth_headers):
    body = {"query": "   ", "top_k": 5}
    response = client.post("/generate/", headers=auth_headers, json=body)
    assert response.status_code == 400


def test_generate_success_with_documents(client, auth_headers, mock_groq):
    ingest_body = {
        "text": "Quantum computers use qubits which can exist in superposition of zero and one simultaneously.",
        "source": "qc.txt",
    }
    ingest_response = client.post("/ingest/text", headers=auth_headers, json=ingest_body)
    client.get(f"/jobs/{ingest_response.json()['job_id']}")

    body = {"query": "What is a qubit?", "top_k": 5}
    response = client.post("/generate/", headers=auth_headers, json=body)
    assert response.status_code == 200
    assert "event: done" in response.text
    assert mock_groq.called


def test_generate_missing_session_header(client):
    headers = {"x-api-key": os.environ["APP_API_KEY"]}
    response = client.post("/generate/", headers=headers, json={"query": "test"})
    assert response.status_code == 422


def test_generate_missing_api_key(client):
    response = client.post("/generate/", headers={"x-session-id": "test-session"}, json={"query": "test"})
    assert response.status_code == 401