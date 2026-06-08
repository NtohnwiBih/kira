import json
from openai import AsyncOpenAI

from app.core.config    import settings
from app.core.redis_client import load_history, save_history
from app.services.prompt_service import prompt_service
from app.utils.logger   import logger, RequestTimer, estimate_cost, generate_request_id
from app.schemas        import ChatRequest, ChatResponse


class ChatService:
    def __init__(self, client: AsyncOpenAI):
        self.client = client

    async def handle(self, request: ChatRequest) -> ChatResponse:
        request_id = generate_request_id()

        with RequestTimer() as timer:
            # ── Load conversation history from Redis ───────────────────────
            history = await load_history(request.user_id)

            # ── Build message array ────────────────────────────────────────
            messages = prompt_service.build_chat_messages(history, request.message)

            # ── Call OpenAI ────────────────────────────────────────────────
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                messages=messages,
                max_tokens=512,
                temperature=0.7,
            )

            reply        = response.choices[0].message.content or ""
            prompt_tok   = response.usage.prompt_tokens
            complete_tok = response.usage.completion_tokens

            # ── 4. Append both turns and persist ─────────────────────────────
            history.append({"role": "user",      "content": request.message})
            history.append({"role": "assistant",  "content": reply})
            await save_history(request.user_id, history)

        logger.info(
            "chat_request",
            request_id=request_id,
            user_id=request.user_id,
            latency_ms=timer.elapsed_ms,
            model=settings.OPENAI_CHAT_MODEL,
            prompt_tokens=prompt_tok,
            completion_tokens=complete_tok,
            cost_usd=estimate_cost(settings.OPENAI_CHAT_MODEL, prompt_tok, complete_tok),
        )

        return ChatResponse(
            reply=reply,
            request_id=request_id,
            model=settings.OPENAI_CHAT_MODEL,
        )