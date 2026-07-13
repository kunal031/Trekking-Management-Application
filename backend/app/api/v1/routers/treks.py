from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_roles
from app.db.session import get_session
from app.models.enums import Difficulty, TrekStatus, UserRole
from app.models.staff_profile import StaffProfile
from app.models.trek import Trek
from app.models.user import User
from app.models.booking import Booking
from app.schemas.trek import AssignStaffRequest, StaffSlotUpdate, TrekCreate, TrekRead, TrekUpdate
from app.schemas.booking import BookingRead
from app.services.redis_cache import clear_trek_cache, get_json, set_json

router = APIRouter(prefix="/treks", tags=["treks"])


@router.get("/", response_model=list[TrekRead])
async def list_treks(
    difficulty: Difficulty | None = None,
    location: str | None = None,
    duration_days: int | None = Query(default=None, gt=0),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> list[dict] | list[Trek]:
    cache_key = f"cache:treks:{difficulty.value if difficulty else 'all'}:{location or 'all'}:{page}"
    cached = await get_json(cache_key)
    if cached is not None:
        return cached

    query = select(Trek).where(Trek.status == TrekStatus.OPEN).order_by(Trek.start_date)
    if difficulty:
        query = query.where(Trek.difficulty == difficulty)
    if location:
        query = query.where(Trek.location.ilike(f"%{location}%"))
    if duration_days:
        query = query.where(Trek.duration_days == duration_days)
    query = query.offset((page - 1) * page_size).limit(page_size)
    treks = list((await session.scalars(query)).all())
    payload = [TrekRead.model_validate(trek).model_dump(mode="json") for trek in treks]
    await set_json(cache_key, payload, ttl_seconds=300)
    return payload


@router.post("/", response_model=TrekRead, status_code=201, dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def create_trek(payload: TrekCreate, session: AsyncSession = Depends(get_session)) -> Trek:
    if payload.assigned_staff_id and not await session.get(StaffProfile, payload.assigned_staff_id):
        raise HTTPException(status_code=404, detail="Staff profile not found")
    trek = Trek(**payload.model_dump())
    session.add(trek)
    await session.commit()
    await session.refresh(trek)
    await clear_trek_cache()
    return trek


@router.put("/{trek_id}", response_model=TrekRead, dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def update_trek(trek_id: UUID, payload: TrekUpdate, session: AsyncSession = Depends(get_session)) -> Trek:
    trek = await session.get(Trek, trek_id)
    if not trek:
        raise HTTPException(status_code=404, detail="Trek not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(trek, key, value)
    if trek.end_date < trek.start_date or trek.available_slots > trek.total_slots:
        raise HTTPException(status_code=422, detail="Invalid trek dates or slots")
    await session.commit()
    await session.refresh(trek)
    await clear_trek_cache()
    return trek


@router.delete("/{trek_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def delete_trek(trek_id: UUID, session: AsyncSession = Depends(get_session)) -> Response:
    trek = await session.get(Trek, trek_id)
    if not trek:
        raise HTTPException(status_code=404, detail="Trek not found")
    await session.delete(trek)
    await session.commit()
    await clear_trek_cache()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{trek_id}/assign-staff", response_model=TrekRead, dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def assign_staff(trek_id: UUID, payload: AssignStaffRequest, session: AsyncSession = Depends(get_session)) -> Trek:
    trek = await session.get(Trek, trek_id)
    staff = await session.get(StaffProfile, payload.staff_profile_id)
    if not trek or not staff:
        raise HTTPException(status_code=404, detail="Trek or staff profile not found")
    trek.assigned_staff_id = staff.id
    await session.commit()
    await session.refresh(trek)
    await clear_trek_cache()
    return trek


@router.get("/assigned/me", response_model=list[TrekRead])
async def assigned_to_me(
    current_user: User = Depends(require_roles(UserRole.STAFF)),
    session: AsyncSession = Depends(get_session),
) -> list[Trek]:
    profile = await session.scalar(select(StaffProfile).where(StaffProfile.user_id == current_user.id))
    if not profile:
        return []
    return list((await session.scalars(select(Trek).where(Trek.assigned_staff_id == profile.id))).all())


@router.patch("/{trek_id}/slot-status", response_model=TrekRead)
async def update_slot_status(
    trek_id: UUID,
    payload: StaffSlotUpdate,
    current_user: User = Depends(require_roles(UserRole.STAFF)),
    session: AsyncSession = Depends(get_session),
) -> Trek:
    profile = await session.scalar(select(StaffProfile).where(StaffProfile.user_id == current_user.id))
    trek = await session.scalar(select(Trek).where(Trek.id == trek_id).with_for_update())
    if not profile or not trek or trek.assigned_staff_id != profile.id:
        raise HTTPException(status_code=404, detail="Assigned trek not found")
    if payload.available_slots > trek.total_slots:
        raise HTTPException(status_code=422, detail="available_slots cannot exceed total_slots")
    trek.available_slots = payload.available_slots
    await session.commit()
    await session.refresh(trek)
    await clear_trek_cache()
    return trek


@router.get("/{trek_id}/bookings", response_model=list[BookingRead])
async def get_trek_participants(
    trek_id: UUID,
    current_user: User = Depends(require_roles(UserRole.STAFF, UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
) -> list[Booking]:
    trek = await session.get(Trek, trek_id)
    if not trek:
        raise HTTPException(status_code=404, detail="Trek not found")
        
    if current_user.role == UserRole.STAFF:
        profile = await session.scalar(select(StaffProfile).where(StaffProfile.user_id == current_user.id))
        if not profile or trek.assigned_staff_id != profile.id:
            raise HTTPException(status_code=403, detail="Not assigned to this trek")
            
    return list((await session.scalars(select(Booking).options(selectinload(Booking.trek)).where(Booking.trek_id == trek_id).order_by(Booking.booking_date.desc()))).all())
