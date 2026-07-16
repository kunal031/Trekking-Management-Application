import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import BookingStatus, PaymentStatus


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("slots_booked > 0", name="ck_booking_slots_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    trek_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("treks.id", ondelete="CASCADE"), nullable=False)
    booking_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.BOOKED, nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    slots_booked: Mapped[int] = mapped_column(Integer, nullable=False)
    participants: Mapped[list[dict]] = mapped_column(JSONB, default=list, server_default='[]')

    user = relationship("User", back_populates="bookings")
    trek = relationship("Trek", back_populates="bookings")
