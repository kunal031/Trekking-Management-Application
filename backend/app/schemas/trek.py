import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import Difficulty, TrekStatus


class TrekBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    location: str = Field(min_length=1, max_length=200)
    difficulty: Difficulty
    duration_days: int = Field(gt=0)
    total_slots: int = Field(gt=0)
    available_slots: int = Field(ge=0)
    status: TrekStatus = TrekStatus.PENDING
    start_date: date
    end_date: date
    price_usd: Decimal = Field(gt=0, decimal_places=2)

    @model_validator(mode="after")
    def validate_dates_and_slots(self) -> "TrekBase":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be greater than or equal to start_date")
        if self.available_slots > self.total_slots:
            raise ValueError("available_slots cannot exceed total_slots")
        return self


class TrekCreate(TrekBase):
    assigned_staff_id: uuid.UUID | None = None


class TrekUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    location: str | None = Field(default=None, min_length=1, max_length=200)
    difficulty: Difficulty | None = None
    duration_days: int | None = Field(default=None, gt=0)
    total_slots: int | None = Field(default=None, gt=0)
    available_slots: int | None = Field(default=None, ge=0)
    assigned_staff_id: uuid.UUID | None = None
    status: TrekStatus | None = None
    start_date: date | None = None
    end_date: date | None = None
    price_usd: Decimal | None = Field(default=None, gt=0, decimal_places=2)


class TrekRead(TrekBase):
    id: uuid.UUID
    assigned_staff_id: uuid.UUID | None

    model_config = ConfigDict(from_attributes=True)


class AssignStaffRequest(BaseModel):
    staff_profile_id: uuid.UUID


class StaffSlotUpdate(BaseModel):
    available_slots: int = Field(ge=0)
