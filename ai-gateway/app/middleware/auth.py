from slowapi            import Limiter
from slowapi.util       import get_remote_address
from slowapi.errors     import RateLimitExceeded
from fastapi            import Request
from fastapi.responses  import JSONResponse
from app.core.config    import settings


def _get_user_id_or_ip(request: Request) -> str:
    """
    Rate limit key: prefer user_id from the JSON body so per-user
    limits apply even across different IPs (VPN, mobile handoff).
    Falls back to IP when user_id is unavailable (e.g. /health).
    """
    try:
        body = request.state._body   
        user_id = body.get("user_id")
        if user_id:
            return f"user:{user_id}"
    except AttributeError:
        pass
    return f"ip:{get_remote_address(request)}"


# Per-user limiter
user_limiter = Limiter(
    key_func=_get_user_id_or_ip,
    default_limits=[f"{settings.RATE_LIMIT_PER_USER}/minute"],
)

# Per-IP limiter
ip_limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_IP}/minute"],
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "detail":      "Too many requests. Please slow down.",
            "retry_after": "60 seconds",
        },
        headers={"Retry-After": "60"},
    )