from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.core.config      import settings
from app.core.redis_client import get_redis, close_redis
from app.middleware.auth  import RequestContextMiddleware, RateLimitMiddleware
from app.utils.logger     import configure_logging, get_logger
from app.routers          import chat, recommendations, support, speech

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info(
        "kira_ai_gateway_starting",
        provider=settings.ai_provider,
        chat_model=settings.resolved_chat_model,
        fast_model=settings.resolved_fast_model,
        port=settings.app_port,
    )

    # Warm up Redis connection
    redis = await get_redis()
    await redis.ping()
    logger.info("redis_connected", url=settings.redis_url)

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    await close_redis()
    logger.info("kira_ai_gateway_stopped")


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Kira AI Gateway",
    description=(
        "Internal-only AI microservice for the Kira food delivery platform.\n\n"
        "**This service is NOT exposed to the public internet.**\n\n"
        "All requests must originate from the NestJS backend and carry "
        "the `X-Service-Key` header. The frontend must never call this service directly."
    ),
    version="1.0.0",
    docs_url="/docs"    if not settings.is_production else None,
    redoc_url="/redoc"  if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)

# ── Middleware (order matters — outermost runs first) ─────────────────────────
app.add_middleware(RequestContextMiddleware)

# Rate limiter needs the Redis client — attach after startup via dependency
@app.on_event("startup")
async def attach_rate_limiter():
    redis = await get_redis()
    app.add_middleware(RateLimitMiddleware, redis_client=redis)


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(chat.router)
app.include_router(recommendations.router)
app.include_router(support.router)
app.include_router(speech.router)


# ── Health & info ─────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return {"service": "kira-ai-gateway", "status": "ok"}


@app.get("/health", tags=["Health"])
async def health():
    """
    Liveness check used by Docker/Kubernetes.
    Returns current AI provider and model configuration.
    """
    redis = await get_redis()
    try:
        await redis.ping()
        redis_ok = True
    except Exception:
        redis_ok = False

    return {
        "status":      "ok" if redis_ok else "degraded",
        "provider":    settings.ai_provider,
        "chat_model":  settings.resolved_chat_model,
        "fast_model":  settings.resolved_fast_model,
        "redis":       "connected" if redis_ok else "unreachable",
    }