async def test_verify_success(client, auth_headers):
    body = {
        "answer": "Qubits can exist in superposition. This allows powerful parallel computation on quantum hardware.",
        "context_chunks": [
            "Qubits can exist in a superposition of both 0 and 1 simultaneously, unlike classical bits."
        ],
    }
    response = await client.post("/api/v1/verify/", headers=auth_headers, json=body)
    assert response.status_code == 200
    data = response.json()
    assert "claims" in data
    assert data["total_claims"] == data["supported_count"] + data["unsupported_count"]


async def test_verify_empty_context_chunks(client, auth_headers):
    body = {
        "answer": "This is a claim that is over twenty characters long and should be unsupported.",
        "context_chunks": [],
    }
    response = await client.post("/api/v1/verify/", headers=auth_headers, json=body)
    assert response.status_code == 200
    data = response.json()
    assert data["supported_count"] == 0
    assert data["grounding_score"] == 0.0


async def test_verify_empty_answer(client, auth_headers):
    body = {"answer": "", "context_chunks": ["Some context chunk here."]}
    response = await client.post("/api/v1/verify/", headers=auth_headers, json=body)
    assert response.status_code == 200
    data = response.json()
    assert data["total_claims"] == 0
    assert data["grounding_score"] == 0.0


async def test_verify_missing_auth_token(client):
    body = {"answer": "Some claim here that is long enough to be split.", "context_chunks": []}
    response = await client.post("/api/v1/verify/", json=body)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "http_error"


async def test_verify_invalid_body_shape_rejected(client, auth_headers):
    response = await client.post("/api/v1/verify/", headers=auth_headers, json={"context_chunks": []})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
