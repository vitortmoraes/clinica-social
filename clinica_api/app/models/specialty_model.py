import uuid
from typing import Optional

from sqlmodel import Field, SQLModel


class Specialty(SQLModel, table=True):
    __tablename__ = "specialties"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True, unique=True)
    anamnesis_type: str = Field(default="general")  # general, nutrition, dental
