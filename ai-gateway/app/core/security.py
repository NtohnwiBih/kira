import secrets
from fastapi import Depends, Header, HTTPException, status
from app.core.config import settings


async def verify_service_key(
    x_service_key: str | None = Header(default=None, alias="X-Service-Key"),
) -> None:
    """
    FastAPI dependency that validates the X-Service-Key header.

    Uses secrets.compare_digest for constant-time comparison to prevent
    timing-based key enumeration attacks.

    Raises HTTP 403 on any failure — no detail about why it failed.
    """
    if x_service_key is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )

    # Constant-time comparison prevents timing attacks
    if not secrets.compare_digest(
        x_service_key.encode("utf-8"),
        settings.SERVICE_KEY.encode("utf-8"),
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )