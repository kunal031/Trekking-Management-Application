import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BookingStatus, PaymentStatus
from app.schemas.trek import TrekRead


class BookingCreate(BaseModel):
    trek_id: uuid.UUID
    slots_booked: int = Field(gt=0)


class BookingRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    trek_id: uuid.UUID
    booking_date: datetime
    status: BookingStatus
    payment_status: PaymentStatus
    slots_booked: int
    trek: TrekRead | None = None

    model_config = ConfigDict(from_attributes=True)


class BookingCostPreview(BaseModel):
    slots_booked: int
    unit_price_usd: Decimal
    total_usd: Decimal
