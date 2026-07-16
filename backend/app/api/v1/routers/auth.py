from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_session
from app.models.user import User
from app.models.staff_profile import StaffProfile
from app.schemas.auth import LoginRequest, TokenResponse, UpdatePasswordRequest
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.schemas.staff import StaffUpdate
from app.models.password_reset import PasswordResetRequest
from app.schemas.password_reset import PasswordResetRequestCreate, ResetPasswordRequest
from app.models.enums import PasswordResetStatus
from datetime import datetime, timezone, timedelta

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
        samesite="none"
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
        samesite="none"
    )
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    response.delete_cookie(key="access_token", httponly=True, secure=True, samesite="none")
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

@router.patch("/update-password", status_code=status.HTTP_204_NO_CONTENT)
async def update_password(payload: UpdatePasswordRequest, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect current password")
    
    current_user.password_hash = hash_password(payload.new_password)
    session.add(current_user)
    await session.commit()
    return None

@router.post("/forgot-password", status_code=status.HTTP_201_CREATED)
async def forgot_password(payload: PasswordResetRequestCreate, session: AsyncSession = Depends(get_session)):
    user = await session.scalar(select(User).where(User.email == payload.email))
    if not user:
        return {"message": "If the email exists, a password reset link has been sent."}
    
    request = PasswordResetRequest(user_id=user.id)
    session.add(request)
    await session.commit()
    
    reset_link = f"http://localhost:5173/reset-password?token={request.id}"
    print(f"\n[SIMULATED EMAIL] To: {user.email}")
    print(f"[SIMULATED EMAIL] Subject: Password Reset Request")
    print(f"[SIMULATED EMAIL] Body: Click the following link to reset your password: {reset_link}\n")
    
    return {"message": "If the email exists, a password reset link has been sent."}

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(payload: ResetPasswordRequest, session: AsyncSession = Depends(get_session)):
    req = await session.scalar(select(PasswordResetRequest).where(PasswordResetRequest.id == payload.token))
    if not req or req.status != PasswordResetStatus.PENDING:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    if datetime.now(timezone.utc) - req.requested_at > timedelta(hours=1):
        req.status = PasswordResetStatus.REJECTED
        session.add(req)
        await session.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    user = await session.scalar(select(User).where(User.id == req.user_id))
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")
        
    user.password_hash = hash_password(payload.new_password)
    req.status = PasswordResetStatus.APPROVED
    
    session.add(user)
    session.add(req)
    await session.commit()
    return {"message": "Password has been successfully reset."}

@router.patch("/me/staff", status_code=status.HTTP_200_OK)
async def update_my_staff_profile(payload: StaffUpdate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    if current_user.role != "STAFF":
        raise HTTPException(status_code=403, detail="Not a staff member")
        
    staff = await session.scalar(select(StaffProfile).where(StaffProfile.user_id == current_user.id))
    if not staff:
        raise HTTPException(status_code=404, detail="Staff profile not found")
        
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(staff, key, value)
        
    await session.commit()
    return {"message": "Staff profile updated successfully."}
