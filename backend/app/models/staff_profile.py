import uuid
from typing import Optional

from sqlalchemy import Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import StaffStatus


class StaffProfile(Base):
    __tablename__ = "staff_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    contact_details: Mapped[Optional[str]] = mapped_column(Text)
    skills: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list, nullable=False)
    status: Mapped[StaffStatus] = mapped_column(
        Enum(StaffStatus, values_callable=lambda enum: [item.value for item in enum]),
        default=StaffStatus.AVAILABLE,
        nullable=False,
    )

    user = relationship("User", back_populates="staff_profile")
    assigned_treks = relationship("Trek", back_populates="assigned_staff")
