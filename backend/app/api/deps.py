from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_session
from app.models.enums import UserRole
from app.models.user import User

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")

    user = await session.scalar(select(User).where(User.id == user_id))
    if not user or not user.is_active or user.is_blacklisted:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive or blacklisted user")
    return user


def require_roles(*roles: UserRole) -> Callable:
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return checker
