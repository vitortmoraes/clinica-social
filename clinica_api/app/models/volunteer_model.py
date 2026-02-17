import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class Volunteer(SQLModel, table=True):
    __tablename__ = "volunteers"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password: str  # Storing as plain/hash based on simple requirement first
    birth_date: str
    phone: str
    specialty: str
    license_number: str  # CRM/CRO/CRP

    # JSON field for availability: [{"day": "Segunda", "start": "08:00", "end": "12:00"}]
    availability: List[Dict[str, Any]] = Field(default=[], sa_column=Column(JSON))

    files: List[Dict[str, str]] = Field(default=[], sa_column=Column(JSON))
    active: bool = Field(default=True)
    appointment_duration: int = Field(default=60)  # Minutes (15, 30, 45, 60)
    photo: Optional[str] = None

    lgpd_consent: bool = Field(default=False)
    lgpd_consent_date: Optional[str] = None
