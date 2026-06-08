from __future__ import annotations
from functools import lru_cache
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Provider: "openai" or "ollama" ────────────────────────────────────────
    ai_provider: str = Field(default="ollama")

    # ── OpenAI ────────────────────────────────────────────────────────────────
    openai_api_key:         str = Field(default="sk-not-set")
    openai_chat_model:      str = Field(default="gpt-4o-mini")
    openai_fast_model:      str = Field(default="gpt-4o-mini")
    openai_analytics_model: str = Field(default="gpt-4o")
    openai_whisper_model:   str = Field(default="whisper-1")
    openai_tts_model:       str = Field(default="tts-1")
    openai_tts_voice:       str = Field(default="nova")

    # ── Ollama (local, free) ──────────────────────────────────────────────────
    ollama_base_url:   str = Field(default="http://localhost:11434/v1")
    ollama_chat_model: str = Field(default="llama3.2")
    ollama_fast_model: str = Field(default="llama3.2")

    # ── Security ──────────────────────────────────────────────────────────────
    service_key: str = Field(default="kira_dev_secret_change_in_production")

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url: str = Field(default="redis://localhost:6379/0")

    # ── App ───────────────────────────────────────────────────────────────────
    app_env:   str = Field(default="development")
    app_host:  str = Field(default="0.0.0.0")
    app_port:  int = Field(default=8000)
    log_level: str = Field(default="INFO")

    # ── Rate limiting ─────────────────────────────────────────────────────────
    rate_limit_per_user:       int = Field(default=30)
    rate_limit_per_ip:         int = Field(default=100)
    rate_limit_window_seconds: int = Field(default=60)

    # ── Conversation memory ───────────────────────────────────────────────────
    chat_history_ttl:      int = Field(default=86_400)
    chat_history_max_msgs: int = Field(default=20)

    @property
    def resolved_chat_model(self) -> str:
        return self.ollama_chat_model if self.use_ollama else self.openai_chat_model

    @property
    def resolved_fast_model(self) -> str:
        return self.ollama_fast_model if self.use_ollama else self.openai_fast_model

    @property
    def use_ollama(self) -> bool:
        return self.ai_provider.lower() == "ollama"

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        valid = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper = v.upper()
        if upper not in valid:
            raise ValueError(f"log_level must be one of {valid}")
        return upper


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()