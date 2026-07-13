from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_roles
from app.db.session import get_session
from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentStatus, TrekStatus, UserRole
from app.models.trek import Trek
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingRead
from app.services.notifications import export_booking_history

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("/", response_model=BookingRead, status_code=201)
async def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(require_roles(UserRole.USER)),
    session: AsyncSession = Depends(get_session),
) -> Booking:
    locked_trek = await session.scalar(select(Trek).where(Trek.id == payload.trek_id).with_for_update())
    if not locked_trek or locked_trek.status != TrekStatus.OPEN:
        raise HTTPException(status_code=404, detail="Open trek not found")
    if locked_trek.available_slots < payload.slots_booked:
        raise HTTPException(status_code=409, detail="Not enough available slots")

    locked_trek.available_slots -= payload.slots_booked
    booking = Booking(
        user_id=current_user.id,
        trek_id=locked_trek.id,
        slots_booked=payload.slots_booked,
        status=BookingStatus.BOOKED,
        payment_status=PaymentStatus.COMPLETED,
    )
    session.add(booking)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="User already booked this trek")

    return (
        await session.scalars(select(Booking).options(selectinload(Booking.trek)).where(Booking.id == booking.id))
    ).one()


@router.get("/my-bookings", response_model=list[BookingRead])
async def my_bookings(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> list[Booking]:
    return list(
        (
            await session.scalars(
                select(Booking)
                .options(selectinload(Booking.trek))
                .where(Booking.user_id == current_user.id)
                .order_by(Booking.booking_date.desc())
            )
        ).all()
    )


@router.post("/{booking_id}/cancel", response_model=BookingRead)
async def cancel_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Booking:
    booking = await session.scalar(select(Booking).where(Booking.id == booking_id).with_for_update())
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot cancel another user's booking")
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=409, detail="Booking already cancelled")

    trek = await session.scalar(select(Trek).where(Trek.id == booking.trek_id).with_for_update())
    if not trek:
        raise HTTPException(status_code=404, detail="Trek not found")

    booking.status = BookingStatus.CANCELLED
    booking.payment_status = PaymentStatus.REFUNDED
    trek.available_slots += booking.slots_booked
    await session.commit()
    return (
        await session.scalars(select(Booking).options(selectinload(Booking.trek)).where(Booking.id == booking.id))
    ).one()


@router.post("/export", status_code=status.HTTP_202_ACCEPTED)
async def export_my_booking_history(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    background_tasks.add_task(export_booking_history, str(current_user.id))
    return {"status": "accepted"}
