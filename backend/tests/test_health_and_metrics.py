async def test_health_check_returns_ok(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_metrics_endpoint_returns_prometheus_text(client):
    await client.get("/health")
    response = await client.get("/metrics")
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
    body = response.text
    assert "prism_requests_total" in body
    assert "prism_request_latency_ms" in body


async def test_metrics_endpoint_reflects_recorded_requests(client):
    await client.get("/health")
    response = await client.get("/metrics")
    assert response.status_code == 200
    assert "prism_requests_in_total" in response.text


async def test_eval_report_not_found_when_absent(client):
    response = await client.get("/eval-report")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "not_found"
    assert "request_id" in data["error"]


async def test_eval_report_returns_content_when_present(client, tmp_path, monkeypatch):
    eval_dir = tmp_path / "eval"
    eval_dir.mkdir()
    report_file = eval_dir / "report.md"
    report_file.write_text("# Test Report\nAll checks passed.")

    import main as main_module
    fake_main_file = tmp_path / "main.py"
    monkeypatch.setattr(main_module, "__file__", str(fake_main_file))

    response = await client.get("/eval-report")
    assert response.status_code == 200
    data = response.json()
    assert "Test Report" in data["content"]
    assert "generated_at" in data