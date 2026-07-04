from __future__ import annotations
from enum import Enum
from pydantic import BaseModel, Field


class UserIntent(str, Enum):
    FOOD_DISCOVERY          = "FOOD_DISCOVERY"
    RESTAURANT_SEARCH       = "RESTAURANT_SEARCH"
    MENU_SEARCH             = "MENU_SEARCH"
    ORDER_TRACKING          = "ORDER_TRACKING"
    ORDER_HELP              = "ORDER_HELP"
    CART_HELP               = "CART_HELP"
    PAYMENT_SUPPORT         = "PAYMENT_SUPPORT"
    RESERVATION_BOOKING     = "RESERVATION_BOOKING"
    RESERVATION_STATUS      = "RESERVATION_STATUS"
    CUSTOMER_SUPPORT        = "CUSTOMER_SUPPORT"
    GENERAL_CHAT            = "GENERAL_CHAT"
    SMALL_TALK              = "SMALL_TALK"
    RESTAURANT_OWNER_ASSIST = "RESTAURANT_OWNER_ASSISTANT"


class DetectedIntent(BaseModel):
    intent:       UserIntent
    confidence:   float = Field(..., ge=0.0, le=1.0)
    requires_llm: bool  = Field(True, description="False = can be served by cache/rules")
    entities:     dict[str, str] = Field(default_factory=dict)
    language:     str = Field("en")