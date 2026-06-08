import json
import redis.asyncio as aioredis
from app.core.config import settings

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


# ── Conversation helpers ──────────────────────────────────────────────────────

def _conversation_key(user_id: str) -> str:
    return f"chat:user:{user_id}"


async def load_history(user_id: str) -> list[dict]:
    """Returns the stored conversation list, or [] if nothing exists."""
    r   = get_redis()
    raw = await r.get(_conversation_key(user_id))
    if not raw:
        return []
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return []


async def save_history(user_id: str, history: list[dict]) -> None:
    """
    Trims to MAX_MESSAGES (keeps the most recent), then persists
    with a refreshed TTL.  TTL resets on every write so an active
    conversation never expires mid-session.
    """
    r = get_redis()
    if len(history) > settings.REDIS_MAX_MESSAGES:
        history = history[-settings.REDIS_MAX_MESSAGES:]
    await r.set(
        _conversation_key(user_id),
        json.dumps(history),
        ex=settings.REDIS_CONVERSATION_TTL,
    )


async def clear_history(user_id: str) -> None:
    r = get_redis()
    await r.delete(_conversation_key(user_id))