import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRead(UserBase):
    id: uuid.UUID
    role: UserRole
    is_active: bool
    is_blacklisted: bool

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = None


class UserBlacklistUpdate(BaseModel):
    is_blacklisted: bool
