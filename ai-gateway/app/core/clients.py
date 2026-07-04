from openai import AsyncOpenAI
import redis.asyncio as aioredis
from app.core.config import settings

_openai: AsyncOpenAI | None = None
_redis:  aioredis.Redis | None = None

def get_openai_client() -> AsyncOpenAI:
    global _openai
    if _openai is None:
        _openai = AsyncOpenAI(api_key=settings.openai_api_key)
    return _openai

async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url, encoding="utf-8",
            decode_responses=True, max_connections=settings.redis_pool_size,
        )
    return _redis

async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None
