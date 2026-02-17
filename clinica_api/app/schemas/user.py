from typing import Optional

from pydantic import BaseModel

from app.models.user_model import Role


class UserBase(BaseModel):
    name: str
    username: str
    role: Role
    avatar: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserChangePassword(BaseModel):
    user_id: str
    current_password: str
    new_password: str


class UserResponse(UserBase):
    id: str
    volunteer_id: Optional[str] = None
