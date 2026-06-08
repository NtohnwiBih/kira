import json
from openai import AsyncOpenAI

from app.core.config             import settings
from app.services.prompt_service import prompt_service
from app.utils.logger            import logger, RequestTimer, estimate_cost, generate_request_id
from app.schemas                 import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationOutput,
)


class RecommendationService:
    def __init__(self, client: AsyncOpenAI):
        self.client = client

    async def handle(self, request: RecommendationRequest) -> RecommendationResponse:
        request_id = generate_request_id()

        with RequestTimer() as timer:
            messages = prompt_service.build_recommendation_messages(request.query)

            response = await self.client.chat.completions.create(
                model=settings.OPENAI_FAST_MODEL,
                messages=messages,
                max_tokens=256,
                temperature=0.0,         
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name":   "recommendation_output",
                        "strict": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "keywords":  {
                                    "type":  "array",
                                    "items": {"type": "string"},
                                },
                                "max_price": {
                                    "anyOf": [{"type": "number"}, {"type": "null"}],
                                },
                                "tags": {
                                    "type":  "array",
                                    "items": {"type": "string"},
                                },
                            },
                            "required":              ["keywords", "max_price", "tags"],
                            "additionalProperties":  False,
                        },
                    },
                },
            )

            raw_json     = response.choices[0].message.content or "{}"
            prompt_tok   = response.usage.prompt_tokens
            complete_tok = response.usage.completion_tokens

            parsed = RecommendationOutput.model_validate_json(raw_json)

        logger.info(
            "recommendation_request",
            request_id=request_id,
            user_id=request.user_id,
            query=request.query,
            latency_ms=timer.elapsed_ms,
            model=settings.OPENAI_FAST_MODEL,
            prompt_tokens=prompt_tok,
            completion_tokens=complete_tok,
            cost_usd=estimate_cost(settings.OPENAI_FAST_MODEL, prompt_tok, complete_tok),
            result=parsed.model_dump(),
        )

        return RecommendationResponse(
            keywords=parsed.keywords,
            max_price=parsed.max_price,
            tags=parsed.tags,
            request_id=request_id,
            model=settings.OPENAI_FAST_MODEL,
        )