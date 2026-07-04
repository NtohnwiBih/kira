from pydantic import BaseModel, Field


class RequestMetrics(BaseModel):
    request_id:      str
    user_id:         str
    endpoint:        str
    intent:          str | None  = None
    model_used:      str
    input_tokens:    int         = 0
    output_tokens:   int         = 0
    total_tokens:    int         = 0
    cost_usd:        float       = 0.0
    latency_ms:      float
    tools_called:    list[str]   = Field(default_factory=list)
    cache_hit:       bool        = False
    llm_skipped:     bool        = False
    success:         bool        = True
    error_code:      str | None  = None
    language:        str         = "en"
    timestamp:       float


class AnalyticsSummary(BaseModel):
    total_requests:   int
    total_cost_usd:   float
    total_tokens:     int
    avg_latency_ms:   float
    cache_hit_rate:   float
    llm_skip_rate:    float
    top_intents:      dict[str, int]
    top_tools:        dict[str, int]
    model_usage:      dict[str, int]