import uuid
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class Role(str, Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    VOLUNTEER = "VOLUNTEER"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    username: str = Field(index=True, unique=True)
    password: str
    role: Role
    avatar: Optional[str] = None
    volunteer_id: Optional[str] = None  # Link if user is a volunteer
