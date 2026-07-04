from enum import Enum
from typing import Any
from pydantic import BaseModel


class ToolName(str, Enum):
    GET_RESTAURANTS          = "get_restaurants"
    GET_RESTAURANT           = "get_restaurant"
    SEARCH_MENU_ITEMS        = "search_menu_items"
    GET_CART                 = "get_cart"
    GET_ORDER_STATUS         = "get_order_status"
    TRACK_ORDER              = "track_order"
    CREATE_RESERVATION       = "create_reservation"
    CHECK_RESERVATION        = "check_reservation"
    GET_USER_PREFERENCES     = "get_user_preferences"
    GET_RESTAURANT_ANALYTICS = "get_restaurant_analytics"
    GET_ORDERS_TODAY         = "get_orders_today"
    GET_REVENUE              = "get_revenue"
    GET_BEST_SELLERS         = "get_best_sellers"


class ToolCall(BaseModel):
    name:       ToolName
    parameters: dict[str, Any] = Field(default_factory=dict)


class ToolResult(BaseModel):
    tool:    ToolName
    success: bool
    data:    Any | None  = None
    error:   str | None  = None
    cached:  bool        = False