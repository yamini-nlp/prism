import threading
import uuid

_jobs = {}
_lock = threading.Lock()


def create_job() -> str:
    job_id = str(uuid.uuid4())
    with _lock:
        _jobs[job_id] = {"status": "pending", "result": None, "error": None}
    return job_id


def set_job_result(job_id: str, result) -> None:
    with _lock:
        if job_id in _jobs:
            _jobs[job_id]["status"] = "complete"
            _jobs[job_id]["result"] = result


def set_job_error(job_id: str, error: str) -> None:
    with _lock:
        if job_id in _jobs:
            _jobs[job_id]["status"] = "failed"
            _jobs[job_id]["error"] = error


def get_job(job_id: str):
    with _lock:
        return _jobs.get(job_id)