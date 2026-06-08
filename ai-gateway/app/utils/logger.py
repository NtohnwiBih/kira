import time
import uuid
import structlog
from app.core.config import settings

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(
        10 if settings.DEBUG else 20  
    ),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()


def generate_request_id() -> str:
    return str(uuid.uuid4())


def estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """
    Rough cost estimate in USD.
    Prices as of late 2024 — update when OpenAI reprices.
    """
    pricing: dict[str, tuple[float, float]] = {
        # (prompt_per_1k, completion_per_1k)
        "gpt-4o-mini":  (0.000150, 0.000600),
        "gpt-4o":       (0.002500, 0.010000),
        "whisper-1":    (0.000006, 0.0),       
        "tts-1":        (0.000015, 0.0),       
    }
    rates = pricing.get(model, (0.002, 0.002))
    return round(
        (prompt_tokens / 1000 * rates[0]) +
        (completion_tokens / 1000 * rates[1]),
        6,
    )


class RequestTimer:
    """Context manager that tracks elapsed milliseconds."""

    def __enter__(self):
        self._start = time.perf_counter()
        return self

    def __exit__(self, *_):
        self.elapsed_ms = round((time.perf_counter() - self._start) * 1000, 2)