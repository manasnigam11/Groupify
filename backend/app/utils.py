"""
Groupify — Authentication Utilities.

Provides JWT token creation/verification and bcrypt password hashing.
Uses the bcrypt library directly instead of passlib to avoid
compatibility issues with Python 3.13.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
import bcrypt
import os

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "1440"))

# ---------------------------------------------------------------------------
# Password Hashing (direct bcrypt — no passlib dependency)
# ---------------------------------------------------------------------------


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password with bcrypt."""
    password_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    if hashed_password == "GOOGLE_AUTH":
        return False
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    try:
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except ValueError:
        return False


# ---------------------------------------------------------------------------
# JWT Token Operations
# ---------------------------------------------------------------------------

def create_access_token(user_id: str, email: str) -> str:
    """
    Create a signed JWT containing the user's ID and email.
    Token expires after JWT_EXPIRATION_MINUTES (default 24 hours).
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT. Returns the payload dict.
    Raises HTTPException 401 if the token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ---------------------------------------------------------------------------
# FastAPI Dependency — Extract current user ID from Authorization header
# ---------------------------------------------------------------------------

_security_scheme = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_security_scheme),
) -> str:
    """
    FastAPI dependency that extracts and validates the Bearer token
    from the Authorization header, returning the user's MongoDB _id string.

    Usage in route:
        @router.get("/me")
        async def me(user_id: str = Depends(get_current_user_id)):
    """
    payload = decode_access_token(credentials.credentials)
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing user identity.",
        )
    return user_id
