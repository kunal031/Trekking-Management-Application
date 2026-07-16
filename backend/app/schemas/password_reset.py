import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import PasswordResetStatus
from app.schemas.user import UserRead

class PasswordResetRequestCreate(BaseModel):
    email: EmailStr

class PasswordResetRequestRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: PasswordResetStatus
    requested_at: datetime
    user: UserRead | None = None

    model_config = ConfigDict(from_attributes=True)
