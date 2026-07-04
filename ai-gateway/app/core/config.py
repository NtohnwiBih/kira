from __future__ import annotations
from functools import lru_cache
from typing import Literal
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    # ── OpenAI ────────────────────────────────────────────────────────────────
    openai_api_key:         str   = Field(..., min_length=10)
    openai_chat_model:      str   = Field("gpt-4.5-mini")
    openai_fallback_model:  str   = Field("gpt-4.5")
    openai_whisper_model:   str   = Field("whisper-1")
    openai_tts_model:       str   = Field("tts-1-hd")
    openai_tts_voice:       str   = Field("nova")

    # ── Security ──────────────────────────────────────────────────────────────
    service_key: str = Field(..., min_length=16)

    # ── Backend ───────────────────────────────────────────────────────────────
    backend_base_url:      str   = Field("http://localhost:4000/api/v1")
    backend_timeout_secs:  float = Field(10.0)
    backend_max_retries:   int   = Field(3)

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url:       str = Field("redis://localhost:6379/0")
    redis_pool_size: int = Field(20)

    # ── App ───────────────────────────────────────────────────────────────────
    app_env:   Literal["development","staging","production"] = Field("development")
    app_host:  str = Field("0.0.0.0")
    app_port:  int = Field(8000)
    log_level: str = Field("INFO")

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    rate_limit_per_user:       int = Field(30)
    rate_limit_per_ip:         int = Field(100)
    rate_limit_window_seconds: int = Field(60)

    # ── Memory ────────────────────────────────────────────────────────────────
    chat_history_ttl:       int = Field(86_400)
    chat_history_max_msgs:  int = Field(20)
    summary_every_n_msgs:   int = Field(10)

    # ── Cache TTLs ────────────────────────────────────────────────────────────
    response_cache_ttl: int = Field(300)
    tool_cache_ttl:     int = Field(60)
    profile_cache_ttl:  int = Field(3_600)

    # ── Circuit Breaker ───────────────────────────────────────────────────────
    circuit_failure_threshold: int = Field(5)
    circuit_recovery_timeout:  int = Field(30)

    # ── Safety ────────────────────────────────────────────────────────────────
    safety_max_input_chars: int  = Field(4_000)
    safety_enabled:         bool = Field(True)

    # ── Cost map (USD / 1k tokens) ────────────────────────────────────────────
    cost_per_1k_tokens: dict[str, float] = Field(default={
        "gpt-4.5-mini": 0.000150,
        "gpt-4.5":      0.003000,
        "whisper-1":    0.006000,
        "tts-1-hd":     0.030000,
        "tts-1":        0.015000,
    })

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @field_validator("log_level")
    @classmethod
    def normalise_log_level(cls, v: str) -> str:
        valid = {"DEBUG","INFO","WARNING","ERROR","CRITICAL"}
        upper = v.upper()
        if upper not in valid:
            raise ValueError(f"log_level must be one of {valid}")
        return upper

    def estimate_cost(self, model: str, tokens: int) -> float:
        rate = self.cost_per_1k_tokens.get(model, 0.001)
        return round((tokens / 1_000) * rate, 8)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
