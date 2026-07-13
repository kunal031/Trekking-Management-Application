import json
from typing import Any

from redis.asyncio import Redis

from app.core.config import settings

redis_client: Redis = Redis.from_url(settings.redis_url, decode_responses=True)


async def get_json(key: str) -> Any | None:
    raw = await redis_client.get(key)
    return json.loads(raw) if raw else None


async def set_json(key: str, value: Any, ttl_seconds: int) -> None:
    await redis_client.set(key, json.dumps(value, default=str), ex=ttl_seconds)


async def clear_trek_cache() -> None:
    async for key in redis_client.scan_iter("cache:treks:*"):
        await redis_client.delete(key)
