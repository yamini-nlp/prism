import json
import logging
import sys
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for field in ("request_id", "route", "latency_ms", "session_id", "status_code", "user_id"):
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = value
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def setup_logging(level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger("prism")
    logger.setLevel(level)
    logger.propagate = False

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)

    return logger


def log_request(logger: logging.Logger, request_id: str, route: str, latency_ms: float,
                 status_code: int, session_id: str = None, user_id: str = None) -> None:
    extra = {
        "request_id": request_id,
        "route": route,
        "latency_ms": latency_ms,
        "status_code": status_code,
    }
    if session_id:
        extra["session_id"] = session_id
    if user_id:
        extra["user_id"] = user_id
    logger.info("request completed", extra=extra)