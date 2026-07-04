import secrets
from fastapi import Header, HTTPException, status

def verify_service_key(x_service_key: str = Header(...)) -> None:
    from app.core.config import settings
    if not secrets.compare_digest(x_service_key, settings.service_key):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
