import json
import logging
from functools import wraps
from typing import Any, Callable, Optional

import redis.asyncio as redis

from core.config import settings

logger = logging.getLogger("prism")

REDIS_URL = settings.redis_url

_redis_client: Optional[redis.Redis] = None

def get_redis_client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
    return _redis_client

async def get_cache(key: str) -> Optional[Any]:
    try:
        client = get_redis_client()
        value = await client.get(key)
    except Exception as exc:
        logger.warning("cache get failed", extra={"cache_key": key, "error": str(exc)})
        return None
    if value is None:
        return None
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return None

async def set_cache(key: str, value: Any, ttl_seconds: int = 3600) -> None:
    try:
        client = get_redis_client()
        await client.set(key, json.dumps(value), ex=ttl_seconds)
    except Exception as exc:
        logger.warning("cache set failed", extra={"cache_key": key, "error": str(exc)})

async def delete_cache(key: str) -> None:
    try:
        client = get_redis_client()
        await client.delete(key)
    except Exception as exc:
        logger.warning("cache delete failed", extra={"cache_key": key, "error": str(exc)})

async def delete_cache_prefix(prefix: str) -> None:
    try:
        client = get_redis_client()
        cursor = 0
        while True:
            cursor, keys = await client.scan(cursor=cursor, match=f"{prefix}*", count=100)
            if keys:
                await client.delete(*keys)
            if cursor == 0:
                break
    except Exception as exc:
        logger.warning("cache prefix delete failed", extra={"cache_prefix": prefix, "error": str(exc)})

def cached(ttl_seconds: int = 3600, key_builder: Optional[Callable[..., str]] = None):
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if key_builder is not None:
                cache_key = key_builder(*args, **kwargs)
            else:
                cache_key = f"{func.__module__}.{func.__qualname__}:{args!r}:{kwargs!r}"

            cached_value = await get_cache(cache_key)
            if cached_value is not None:
                return cached_value

            result = await func(*args, **kwargs)
            await set_cache(cache_key, result, ttl_seconds)
            return result

        return wrapper

    return decorator
