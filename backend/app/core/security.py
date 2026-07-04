"""
Security utilities for authentication and authorization.
Handles JWT token creation/validation and password hashing.
"""
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Union

from jose import jwt

from app.core.config import settings

# Password hashing using PBKDF2 with HMAC-SHA256 (stdlib only)
PBKDF2_ITERATIONS = 100000
HASH_ALGORITHM = "sha256"
SALT_LENGTH = 16


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hash.

    Args:
        plain_password: The plain text password to verify
        hashed_password: The stored hashed password (format: iterations$salt$hash)

    Returns:
        True if password matches, False otherwise
    """
    try:
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
        iterations = int(parts[0])
        salt = bytes.fromhex(parts[1])
        stored_hash = parts[2]

        computed_hash = hashlib.pbkdf2_hmac(
            HASH_ALGORITHM, plain_password.encode(), salt, iterations
        ).hex()

        return hmac.compare_digest(computed_hash, stored_hash)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """
    Hash a plain text password using PBKDF2.

    Args:
        password: Plain text password to hash

    Returns:
        Hashed password string (format: iterations$salt$hash)
    """
    salt = os.urandom(SALT_LENGTH)
    hash_val = hashlib.pbkdf2_hmac(
        HASH_ALGORITHM, password.encode(), salt, PBKDF2_ITERATIONS
    ).hex()
    return f"{PBKDF2_ITERATIONS}${salt.hex()}${hash_val}"


def create_access_token(
    subject: Union[str, int],
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[dict] = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        subject: User identifier (usually user ID or email)
        expires_delta: Optional custom expiration time
        additional_claims: Additional claims to include in token

    Returns:
        Encoded JWT token string
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "access",
        "iat": datetime.now(timezone.utc),
    }

    if additional_claims:
        to_encode.update(additional_claims)

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, int],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT refresh token.

    Args:
        subject: User identifier
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT refresh token string
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh",
        "iat": datetime.now(timezone.utc),
    }

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload

    Raises:
        jwt.JWTError: If token is invalid or expired
    """
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    return payload


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """
    Verify a token and check its type.

    Args:
        token: JWT token string
        token_type: Expected token type ("access" or "refresh")

    Returns:
        Decoded payload if valid, None otherwise
    """
    try:
        payload = decode_token(token)
        if payload.get("type") != token_type:
            return None
        return payload
    except Exception:
        return None