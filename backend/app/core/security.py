from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError

from app.core.config import settings
from app.models.enums import UserRole

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(password, password_hash)
    except UnknownHashError:
        return False


def create_access_token(user_id: UUID, role: UserRole) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "role": role.value, "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
