import io


async def test_upload_txt_success(client, auth_headers):
    content = b"This is a sufficiently long piece of uploaded text content for testing purposes today."
    files = {"file": ("test.txt", io.BytesIO(content), "text/plain")}
    response = await client.post("/api/v1/upload/", headers=auth_headers, files=files)
    assert response.status_code == 202
    job_id = response.json()["job_id"]

    job_response = await client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)
    assert job_response.status_code == 200
    job = job_response.json()
    assert job["status"] == "complete"
    assert job["result"]["chunks_created"] >= 1


async def test_upload_unsupported_extension_rejected(client, auth_headers):
    files = {"file": ("test.exe", io.BytesIO(b"binary content"), "application/octet-stream")}
    response = await client.post("/api/v1/upload/", headers=auth_headers, files=files)
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "validation_error"


async def test_upload_content_mismatched_extension_rejected(client, auth_headers):
    files = {"file": ("fake.pdf", io.BytesIO(b"this is not really a pdf file"), "application/pdf")}
    response = await client.post("/api/v1/upload/", headers=auth_headers, files=files)
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "validation_error"


async def test_upload_too_short_text_fails_job(client, auth_headers):
    files = {"file": ("short.txt", io.BytesIO(b"too short"), "text/plain")}
    response = await client.post("/api/v1/upload/", headers=auth_headers, files=files)
    assert response.status_code == 202
    job_id = response.json()["job_id"]

    job = (await client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)).json()
    assert job["status"] == "failed"


async def test_upload_sanitizes_unsafe_filename(client, auth_headers):
    content = b"This is a sufficiently long piece of uploaded text content for filename sanitization testing."
    files = {"file": ("../../etc/passwd.txt", io.BytesIO(content), "text/plain")}
    response = await client.post("/api/v1/upload/", headers=auth_headers, files=files)
    assert response.status_code == 202
    job_id = response.json()["job_id"]
    job = (await client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)).json()
    assert job["status"] == "complete"
    assert "/" not in job["result"]["source"]
    assert ".." not in job["result"]["source"]


async def test_upload_missing_auth_token(client):
    files = {"file": ("test.txt", io.BytesIO(b"some reasonably long text content here today"), "text/plain")}
    response = await client.post("/api/v1/upload/", files=files)
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "http_error"


async def test_upload_invalid_bearer_token(client):
    files = {"file": ("test.txt", io.BytesIO(b"some reasonably long text content here today"), "text/plain")}
    headers = {"Authorization": "Bearer not-a-real-token"}
    response = await client.post("/api/v1/upload/", headers=headers, files=files)
    assert response.status_code == 401


async def test_upload_rate_limit_triggers_429(client, auth_headers):
    content = b"Small text content used for rate limit boundary testing across many upload requests today."
    responses = []
    for _ in range(11):
        files = {"file": ("ratelimit.txt", io.BytesIO(content), "text/plain")}
        response = await client.post("/api/v1/upload/", headers=auth_headers, files=files)
        responses.append(response)
    statuses = [r.status_code for r in responses]
    assert 429 in statuses
    limited = next(r for r in responses if r.status_code == 429)
    data = limited.json()
    assert data["error"]["code"] == "rate_limited"