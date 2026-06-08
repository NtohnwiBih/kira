from fastapi import APIRouter, Depends, Request
from openai import AsyncOpenAI

from app.core.openai_client       import get_openai_client
from app.core.security            import verify_service_key
from app.services.support_service import SupportService
from app.services.prompt_service  import PromptService
from app.schemas.all_schemas      import SupportRequest, SupportResponse

router = APIRouter(
    prefix="/support",
    tags=["Support"],
    dependencies=[Depends(verify_service_key)],
)

_prompt_service = PromptService()


@router.post("", response_model=SupportResponse)
async def support(
    payload:       SupportRequest,
    request:       Request,
    openai_client: AsyncOpenAI = Depends(get_openai_client),
) -> SupportResponse:
    """
    Generates a natural language answer to a customer support question.

    NestJS must pre-assemble the `context` field with order/delivery data
    before calling this endpoint. The AI Gateway NEVER queries the database.

    Example context:
    ```json
    {
      "status": "OUT_FOR_DELIVERY",
      "driver_name": "Jean",
      "estimated_minutes": 12,
      "order_number": "KIRA-20260101-0042"
    }
    ```
    """
    service = SupportService(openai_client, _prompt_service)
    result  = await service.handle(
        user_id    = payload.user_id,
        question   = payload.question,
        context    = payload.context.model_dump(exclude_none=True),
        request_id = getattr(request.state, "request_id", ""),
    )
    return SupportResponse(**result)