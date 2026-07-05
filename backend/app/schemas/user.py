"""
EdgeTwin-BMS+ User Schemas
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """
    Base user schema.
    """
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: Optional[str] = None
    role: str = Field(default="viewer", pattern="^(admin|operator|viewer|api)$")


class UserCreate(UserBase):
    """
    Schema for creating a user.
    """
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    """
    Schema for updating a user.
    """
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    full_name: Optional[str] = None
    role: Optional[str] = Field(None, pattern="^(admin|operator|viewer|api)$")
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """
    Schema for user response.
    """
    id: UUID
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """
    Schema for paginated user list response.
    """
    items: list[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ChangePassword(BaseModel):
    """
    Schema for changing password.
    """
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class Token(BaseModel):
    """
    Schema for JWT token response.
    """
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """
    Schema for JWT token payload.
    """
    sub: str
    exp: datetime
    type: str


class LoginRequest(BaseModel):
    """
    Schema for login request.
    """
    username: str
    password: str
