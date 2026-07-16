import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import StaffStatus
from app.schemas.user import UserCreate, UserRead


class StaffCreate(BaseModel):
    user: UserCreate
    contact_details: str | None = None
    skills: list[str] = Field(default_factory=list)
    status: StaffStatus = StaffStatus.AVAILABLE


class StaffRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user: UserRead
    contact_details: str | None
    skills: list[str]
    status: StaffStatus

    model_config = ConfigDict(from_attributes=True)

class StaffUpdate(BaseModel):
    skills: list[str] | None = None
    status: StaffStatus | None = None
    contact_details: str | None = None
