from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    user_id:  str = Field(..., description="UUID from NestJS — never from frontend")
    message:  str = Field(..., min_length=1, max_length=4000)
    role:     str = Field("CUSTOMER", description="CUSTOMER | RESTAURANT_OWNER | DRIVER")
    locale:   str = Field("auto")


class ChatResponse(BaseModel):
    reply:      str
    intent:     str | None         = None
    tools_used: list[str]          = Field(default_factory=list)
    user_id:    str
    request_id: str
    model_used: str
    language:   str
    from_cache: bool = False
