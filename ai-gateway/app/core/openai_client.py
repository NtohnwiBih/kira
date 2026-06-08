
from openai import AsyncOpenAI
from app.core.config import settings

_client: AsyncOpenAI | None = None


def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if settings.use_ollama:
            _client = AsyncOpenAI(
                base_url=settings.ollama_base_url,
                api_key="ollama",       
            )
        else:
            _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client