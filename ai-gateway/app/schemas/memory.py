from typing import Literal
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role:    Literal["user", "assistant", "system", "tool"]
    content: str


class ConversationSummary(BaseModel):
    summary:    str
    created_at: float
    msg_count:  int


class UserPreferences(BaseModel):
    favorite_cuisines:     list[str]    = Field(default_factory=list)
    favorite_restaurants:  list[str]    = Field(default_factory=list)
    favorite_meals:        list[str]    = Field(default_factory=list)
    average_budget_xaf:    float | None = None
    delivery_preferred:    bool         = True
    preferred_language:    str          = "en"
    dietary_restrictions:  list[str]    = Field(default_factory=list)
    last_updated:          float | None = None


class ConversationMemory(BaseModel):
    user_id:     str
    messages:    list[ChatMessage]       = Field(default_factory=list)
    summary:     ConversationSummary | None = None
    preferences: UserPreferences         = Field(default_factory=UserPreferences)
    last_intent: str | None              = None