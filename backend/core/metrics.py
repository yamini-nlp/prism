import threading

_lock = threading.Lock()
_total_requests = 0
_total_latency_ms = 0.0
_route_counts = {}


def record_request(route: str, latency_ms: float) -> None:
    global _total_requests, _total_latency_ms
    with _lock:
        _total_requests += 1
        _total_latency_ms += latency_ms
        _route_counts[route] = _route_counts.get(route, 0) + 1


def get_metrics() -> dict:
    with _lock:
        avg_latency_ms = (_total_latency_ms / _total_requests) if _total_requests else 0.0
        return {
            "total_requests": _total_requests,
            "average_latency_ms": round(avg_latency_ms, 2),
            "requests_per_route": dict(_route_counts),
        }


def reset_metrics() -> None:
    global _total_requests, _total_latency_ms
    with _lock:
        _total_requests = 0
        _total_latency_ms = 0.0
        _route_counts.clear()