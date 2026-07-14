import uuid
from datetime import date
from typing import Optional
from decimal import Decimal

from sqlalchemy import CheckConstraint, Date, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import Difficulty, TrekStatus


class Trek(Base):
    __tablename__ = "treks"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_treks_end_after_start"),
        CheckConstraint("available_slots >= 0 AND available_slots <= total_slots", name="ck_treks_slots_valid"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    difficulty: Mapped[Difficulty] = mapped_column(Enum(Difficulty), index=True, nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    total_slots: Mapped[int] = mapped_column(Integer, nullable=False)
    available_slots: Mapped[int] = mapped_column(Integer, nullable=False)
    assigned_staff_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("staff_profiles.id", ondelete="SET NULL"))
    status: Mapped[TrekStatus] = mapped_column(Enum(TrekStatus), default=TrekStatus.PENDING, index=True, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    price_usd: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    assigned_staff = relationship("StaffProfile", back_populates="assigned_treks")
    bookings = relationship("Booking", back_populates="trek", cascade="all, delete-orphan")

    @property
    def assigned_staff_name(self) -> str | None:
        if self.assigned_staff and self.assigned_staff.user:
            return f"{self.assigned_staff.user.first_name} {self.assigned_staff.user.last_name}"
        return None
