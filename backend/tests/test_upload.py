import io
import os


def test_upload_txt_success(client, auth_headers):
    content = b"This is a sufficiently long piece of uploaded text content for testing purposes today."
    files = {"file": ("test.txt", io.BytesIO(content), "text/plain")}
    response = client.post("/upload/", headers=auth_headers, files=files)
    assert response.status_code == 202
    job_id = response.json()["job_id"]

    job_response = client.get(f"/jobs/{job_id}")
    assert job_response.status_code == 200
    job = job_response.json()
    assert job["status"] == "complete"
    assert job["result"]["chunks_created"] >= 1


def test_upload_unsupported_file_type(client, auth_headers):
    files = {"file": ("test.exe", io.BytesIO(b"binary content"), "application/octet-stream")}
    response = client.post("/upload/", headers=auth_headers, files=files)
    assert response.status_code == 400


def test_upload_too_short_text_fails_job(client, auth_headers):
    files = {"file": ("short.txt", io.BytesIO(b"too short"), "text/plain")}
    response = client.post("/upload/", headers=auth_headers, files=files)
    assert response.status_code == 202
    job_id = response.json()["job_id"]

    job = client.get(f"/jobs/{job_id}").json()
    assert job["status"] == "failed"


def test_upload_missing_session_header(client):
    headers = {"x-api-key": os.environ["APP_API_KEY"]}
    files = {"file": ("test.txt", io.BytesIO(b"some reasonably long text content here"), "text/plain")}
    response = client.post("/upload/", headers=headers, files=files)
    assert response.status_code == 422


def test_upload_missing_api_key(client):
    files = {"file": ("test.txt", io.BytesIO(b"some reasonably long text content here"), "text/plain")}
    response = client.post("/upload/", headers={"x-session-id": "test-session"}, files=files)
    assert response.status_code == 401