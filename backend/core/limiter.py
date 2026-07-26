from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.security import decode_token

UPLOAD_RATE_LIMIT = "10/minute"
GENERATE_RATE_LIMIT = "20/minute"
AUTH_RATE_LIMIT = "5/minute"


def get_rate_limit_key(request: Request) -> str:
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        payload = decode_token(token)
        if payload and payload.get("type") == "access" and payload.get("sub"):
            return f"user:{payload['sub']}"
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=get_rate_limit_key)