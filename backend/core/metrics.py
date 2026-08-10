import math
import threading

_lock = threading.Lock()
_total_requests = 0
_total_latency_ms = 0.0
_route_counts = {}
_cache_hits = 0
_cache_misses = 0

_route_request_count = {}
_route_error_count = {}
_route_latencies = {}
_MAX_SAMPLES_PER_ROUTE = 2000


def record_request(route: str, latency_ms: float, status_code: int = 200) -> None:
    global _total_requests, _total_latency_ms
    with _lock:
        _total_requests += 1
        _total_latency_ms += latency_ms
        _route_counts[route] = _route_counts.get(route, 0) + 1
        _route_request_count[route] = _route_request_count.get(route, 0) + 1
        if status_code >= 400:
            _route_error_count[route] = _route_error_count.get(route, 0) + 1
        samples = _route_latencies.setdefault(route, [])
        samples.append(latency_ms)
        if len(samples) > _MAX_SAMPLES_PER_ROUTE:
            del samples[: len(samples) - _MAX_SAMPLES_PER_ROUTE]


def record_cache_hit(key: str) -> None:
    global _cache_hits
    with _lock:
        _cache_hits += 1


def record_cache_miss(key: str) -> None:
    global _cache_misses
    with _lock:
        _cache_misses += 1


def get_metrics() -> dict:
    with _lock:
        avg_latency_ms = (_total_latency_ms / _total_requests) if _total_requests else 0.0
        cache_total = _cache_hits + _cache_misses
        cache_hit_rate = (_cache_hits / cache_total) if cache_total else 0.0
        return {
            "total_requests": _total_requests,
            "average_latency_ms": round(avg_latency_ms, 2),
            "requests_per_route": dict(_route_counts),
            "cache_hits": _cache_hits,
            "cache_misses": _cache_misses,
            "cache_hit_rate": round(cache_hit_rate, 4),
        }


def reset_metrics() -> None:
    global _total_requests, _total_latency_ms, _cache_hits, _cache_misses
    with _lock:
        _total_requests = 0
        _total_latency_ms = 0.0
        _route_counts.clear()
        _cache_hits = 0
        _cache_misses = 0
        _route_request_count.clear()
        _route_error_count.clear()
        _route_latencies.clear()


def _percentile(values, pct):
    if not values:
        return 0.0
    ordered = sorted(values)
    k = (len(ordered) - 1) * (pct / 100)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return ordered[int(k)]
    lower = ordered[int(f)] * (c - k)
    upper = ordered[int(c)] * (k - f)
    return lower + upper


def get_route_metrics() -> dict:
    with _lock:
        result = {}
        for route, latencies in _route_latencies.items():
            result[route] = {
                "request_count": _route_request_count.get(route, 0),
                "error_count": _route_error_count.get(route, 0),
                "p50_latency_ms": round(_percentile(latencies, 50), 2),
                "p95_latency_ms": round(_percentile(latencies, 95), 2),
                "p99_latency_ms": round(_percentile(latencies, 99), 2),
            }
        return result


def _sanitize_route_label(route: str) -> str:
    return route.replace("\\", "").replace('"', "'")


def generate_prometheus_metrics() -> str:
    route_metrics = get_route_metrics()
    overall = get_metrics()
    lines = []

    lines.append("# HELP prism_requests_total Total number of requests per route")
    lines.append("# TYPE prism_requests_total counter")
    for route, data in route_metrics.items():
        label = _sanitize_route_label(route)
        lines.append(f'prism_requests_total{{route="{label}"}} {data["request_count"]}')

    lines.append("# HELP prism_errors_total Total number of error responses per route")
    lines.append("# TYPE prism_errors_total counter")
    for route, data in route_metrics.items():
        label = _sanitize_route_label(route)
        lines.append(f'prism_errors_total{{route="{label}"}} {data["error_count"]}')

    lines.append("# HELP prism_request_latency_ms Request latency percentiles in milliseconds per route")
    lines.append("# TYPE prism_request_latency_ms summary")
    for route, data in route_metrics.items():
        label = _sanitize_route_label(route)
        lines.append(f'prism_request_latency_ms{{route="{label}",quantile="0.5"}} {data["p50_latency_ms"]}')
        lines.append(f'prism_request_latency_ms{{route="{label}",quantile="0.95"}} {data["p95_latency_ms"]}')
        lines.append(f'prism_request_latency_ms{{route="{label}",quantile="0.99"}} {data["p99_latency_ms"]}')

    lines.append("# HELP prism_requests_in_total Total number of requests recorded across all routes")
    lines.append("# TYPE prism_requests_in_total counter")
    lines.append(f'prism_requests_in_total {overall["total_requests"]}')

    lines.append("# HELP prism_cache_hits_total Total number of cache hits")
    lines.append("# TYPE prism_cache_hits_total counter")
    lines.append(f'prism_cache_hits_total {overall["cache_hits"]}')

    lines.append("# HELP prism_cache_misses_total Total number of cache misses")
    lines.append("# TYPE prism_cache_misses_total counter")
    lines.append(f'prism_cache_misses_total {overall["cache_misses"]}')

    return "\n".join(lines) + "\n"
