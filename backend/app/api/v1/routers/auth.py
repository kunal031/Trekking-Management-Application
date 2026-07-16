from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_session
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, response: Response, session: AsyncSession = Depends(get_session)) -> TokenResponse:
    existing = await session.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    token = create_access_token(user.id, user.role)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, response: Response, session: AsyncSession = Depends(get_session)) -> TokenResponse:
    user = await session.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active or user.is_blacklisted:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive or blacklisted")

    token = create_access_token(user.id, user.role)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    response.delete_cookie(key="access_token", httponly=True, secure=True, samesite="lax")
    return None


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.put("/me", response_model=UserRead)
async def update_me(payload: UserUpdate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> User:
    if payload.first_name is not None:
        current_user.first_name = payload.first_name
    if payload.last_name is not None:
        current_user.last_name = payload.last_name
    if payload.phone is not None:
        current_user.phone = payload.phone
    
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user
