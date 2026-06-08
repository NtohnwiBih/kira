from fastapi import APIRouter, Depends, Request
from openai import AsyncOpenAI

from app.core.openai_client              import get_openai_client
from app.core.security                   import verify_service_key
from app.services.recommendation_service import RecommendationService
from app.services.prompt_service         import PromptService
from app.schemas.all_schemas             import RecommendationRequest, RecommendationResponse

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"],
    dependencies=[Depends(verify_service_key)],
)

_prompt_service = PromptService()


@router.post("", response_model=RecommendationResponse)
async def recommend(
    payload:       RecommendationRequest,
    request:       Request,
    openai_client: AsyncOpenAI = Depends(get_openai_client),
) -> RecommendationResponse:
    """
    Extracts structured food search criteria from a natural language query.

    Input:  `"I want spicy chicken under 5000 XAF"`
    Output: `{ keywords: ["chicken"], max_price: 5000, tags: ["spicy"] }`

    NestJS uses the output to query the restaurant/menu database.
    This endpoint never touches the database itself.
    """
    service = RecommendationService(openai_client, _prompt_service)
    result  = await service.handle(
        user_id    = payload.user_id,
        query      = payload.query,
        request_id = getattr(request.state, "request_id", ""),
    )
    return RecommendationResponse(**result)