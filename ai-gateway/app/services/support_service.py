from openai import AsyncOpenAI

from app.core.config             import settings
from app.services.prompt_service import prompt_service
from app.utils.logger            import logger, RequestTimer, estimate_cost, generate_request_id
from app.schemas                 import SupportRequest, SupportResponse


class SupportService:
    def __init__(self, client: AsyncOpenAI):
        self.client = client

    async def handle(self, request: SupportRequest) -> SupportResponse:
        request_id = generate_request_id()

        with RequestTimer() as timer:
            messages = prompt_service.build_support_messages(
                request.question,
                request.context,
            )

            response = await self.client.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                messages=messages,
                max_tokens=300,
                temperature=0.5,
            )

            answer       = response.choices[0].message.content or ""
            prompt_tok   = response.usage.prompt_tokens
            complete_tok = response.usage.completion_tokens

        logger.info(
            "support_request",
            request_id=request_id,
            user_id=request.user_id,
            order_number=request.context.order_number,
            order_status=request.context.status,
            latency_ms=timer.elapsed_ms,
            model=settings.OPENAI_CHAT_MODEL,
            prompt_tokens=prompt_tok,
            completion_tokens=complete_tok,
            cost_usd=estimate_cost(settings.OPENAI_CHAT_MODEL, prompt_tok, complete_tok),
        )

        return SupportResponse(
            answer=answer,
            request_id=request_id,
            model=settings.OPENAI_CHAT_MODEL,
        )