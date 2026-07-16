import secrets
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_roles
from app.core.security import hash_password
from app.db.session import get_session
from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentStatus, TrekStatus, UserRole
from app.models.staff_profile import StaffProfile
from app.models.trek import Trek
from app.models.user import User
from app.schemas.booking import BookingRead
from app.schemas.dashboard import DashboardStats
from app.schemas.staff import StaffCreate, StaffRead, StaffUpdate
from app.schemas.trek import TrekRead
from app.schemas.user import UserBlacklistUpdate, UserRead
from app.services import notifications

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_roles(UserRole.ADMIN))])


@router.get("/dashboard/stats", response_model=DashboardStats)
async def dashboard_stats(session: AsyncSession = Depends(get_session)) -> DashboardStats:
    users = await session.scalar(select(func.count(User.id)))
    active_staff = await session.scalar(select(func.count(User.id)).where(User.role == UserRole.STAFF, User.is_active == True, User.is_blacklisted == False))
    open_treks = await session.scalar(select(func.count(Trek.id)).where(Trek.status == TrekStatus.OPEN))
    booked_slots = await session.scalar(select(func.coalesce(func.sum(Booking.slots_booked), 0)).where(Booking.status == BookingStatus.BOOKED))
    
    current_month_start = date.today().replace(day=1)
    revenue = await session.scalar(
        select(func.coalesce(func.sum(Booking.slots_booked * Trek.price_usd), 0))
        .join(Trek, Booking.trek_id == Trek.id)
        .where(Booking.payment_status == PaymentStatus.COMPLETED)
        .where(Booking.booking_date >= current_month_start)
    )
    status_rows = await session.execute(select(Booking.status, func.count(Booking.id)).group_by(Booking.status))
    
    return DashboardStats(
        users=users or 0,
        open_treks=open_treks or 0,
        booked_slots=booked_slots or 0,
        revenue_usd=float(revenue or 0),
        active_staff=active_staff or 0,
        bookings_by_status={status.value: count for status, count in status_rows.all()},
    )


@router.get("/users", response_model=list[UserRead])
async def list_users(session: AsyncSession = Depends(get_session)) -> list[User]:
    return list((await session.scalars(select(User).order_by(User.email))).all())


@router.get("/staff", response_model=list[StaffRead])
async def list_staff(session: AsyncSession = Depends(get_session)) -> list[StaffProfile]:
    return list((await session.scalars(select(StaffProfile).options(selectinload(StaffProfile.user)))).all())


@router.get("/treks", response_model=list[TrekRead])
async def list_treks(session: AsyncSession = Depends(get_session)) -> list[Trek]:
    return list((await session.scalars(select(Trek).options(selectinload(Trek.assigned_staff).selectinload(StaffProfile.user)).order_by(Trek.start_date.desc()))).all())


@router.post("/staff", response_model=StaffRead, status_code=201)
async def create_staff(payload: StaffCreate, session: AsyncSession = Depends(get_session)) -> StaffProfile:
    existing = await session.scalar(select(User).where(User.email == payload.user.email))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.user.email,
        password_hash=hash_password(payload.user.password),
        first_name=payload.user.first_name,
        last_name=payload.user.last_name,
        phone=payload.user.phone,
        role=UserRole.STAFF,
    )
    profile = StaffProfile(user=user, contact_details=payload.contact_details, skills=payload.skills, status=payload.status)
    session.add(profile)
    await session.commit()
    query = select(StaffProfile).options(selectinload(StaffProfile.user)).where(StaffProfile.id == profile.id)
    return (await session.scalars(query)).one()
@router.patch("/staff/{staff_id}", response_model=StaffRead)
async def update_staff(staff_id: UUID, payload: StaffUpdate, session: AsyncSession = Depends(get_session)) -> StaffProfile:
    staff = await session.get(StaffProfile, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff profile not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(staff, key, value)
        
    await session.commit()
    query = select(StaffProfile).options(selectinload(StaffProfile.user)).where(StaffProfile.id == staff.id)
    return (await session.scalars(query)).one()

@router.patch("/users/{user_id}/blacklist", response_model=UserRead)
async def blacklist_user(user_id: UUID, payload: UserBlacklistUpdate, session: AsyncSession = Depends(get_session)) -> User:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_blacklisted = payload.is_blacklisted
    await session.commit()
    await session.refresh(user)
    return user


@router.get("/bookings", response_model=list[BookingRead])
async def list_bookings(session: AsyncSession = Depends(get_session)) -> list[Booking]:
    return list((await session.scalars(select(Booking).options(selectinload(Booking.user), selectinload(Booking.trek).selectinload(Trek.assigned_staff).selectinload(StaffProfile.user)).order_by(Booking.booking_date.desc()))).all())

