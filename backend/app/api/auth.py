"""Admin login and signed bearer-token validation."""
import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "12345678")
TOKEN_SECRET = os.getenv("ADMIN_AUTH_SECRET") or secrets.token_urlsafe(48)
TOKEN_TTL_SECONDS = 8 * 60 * 60

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=128)
    password: str = Field(..., min_length=1, max_length=1024)


def _encode_token(username: str) -> str:
    claims = json.dumps(
        {"sub": username, "exp": int(time.time()) + TOKEN_TTL_SECONDS},
        separators=(",", ":"),
    ).encode("utf-8")
    payload = base64.urlsafe_b64encode(claims).rstrip(b"=")
    signature = hmac.new(TOKEN_SECRET.encode("utf-8"), payload, hashlib.sha256).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).rstrip(b"=")
    return f"{payload.decode('ascii')}.{encoded_signature.decode('ascii')}"


def _decode_token(token: str) -> Optional[str]:
    try:
        payload, encoded_signature = token.split(".", 1)
        expected_signature = hmac.new(
            TOKEN_SECRET.encode("utf-8"),
            payload.encode("ascii"),
            hashlib.sha256,
        ).digest()
        signature = base64.urlsafe_b64decode(encoded_signature + "=" * (-len(encoded_signature) % 4))
        if not hmac.compare_digest(signature, expected_signature):
            return None

        claims_bytes = base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))
        claims = json.loads(claims_bytes)
        if not isinstance(claims, dict):
            return None
        if claims.get("sub") != ADMIN_USERNAME or int(claims.get("exp", 0)) <= int(time.time()):
            return None
        return ADMIN_USERNAME
    except (AttributeError, ValueError, TypeError, json.JSONDecodeError):
        return None


def require_admin(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = _decode_token(authorization[7:].strip())
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username


@router.post("/login")
def login(payload: LoginRequest):
    username_matches = hmac.compare_digest(
        payload.username.encode("utf-8"),
        ADMIN_USERNAME.encode("utf-8"),
    )
    password_matches = hmac.compare_digest(
        payload.password.encode("utf-8"),
        ADMIN_PASSWORD.encode("utf-8"),
    )
    if not (username_matches and password_matches):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
        )

    return {
        "access_token": _encode_token(ADMIN_USERNAME),
        "token_type": "bearer",
        "expires_in": TOKEN_TTL_SECONDS,
    }


@router.get("/me")
def get_current_admin(username: str = Depends(require_admin)):
    return {"username": username}
