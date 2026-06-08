from fastapi import APIRouter, Depends, Request
from openai import AsyncOpenAI
import redis.asyncio as aioredis

from app.core.openai_client        import get_openai_client
from app.core.redis_client         import get_redis
from app.core.security             import verify_service_key
from app.services.chat_service     import ChatService
from app.services.prompt_service   import PromptService
from app.schemas.all_schemas       import ChatRequest, ChatResponse

router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
    dependencies=[Depends(verify_service_key)],
)

_prompt_service = PromptService()


@router.post("", response_model=ChatResponse)
async def chat(
    payload:       ChatRequest,
    request:       Request,
    openai_client: AsyncOpenAI    = Depends(get_openai_client),
    redis_client:  aioredis.Redis = Depends(get_redis),
) -> ChatResponse:
    """
    Multi-turn conversational AI.
    Fetches Redis history → calls model → saves updated history.
    Never called by the frontend directly.
    """
    service = ChatService(openai_client, redis_client, _prompt_service)
    result  = await service.handle(
        user_id    = payload.user_id,
        message    = payload.message,
        request_id = getattr(request.state, "request_id", ""),
    )
    return ChatResponse(**result)