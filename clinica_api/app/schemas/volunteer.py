from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class VolunteerBase(BaseModel):
    name: str
    email: str
    birth_date: str
    phone: str
    specialty: str
    license_number: str
    availability: List[Dict[str, Any]] = []
    files: List[Dict[str, str]] = []
    active: bool = True
    appointment_duration: int = 60
    photo: Optional[str] = None
    lgpd_consent: bool = False
    lgpd_consent_date: Optional[str] = None


class VolunteerCreate(VolunteerBase):
    password: str


class VolunteerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    birth_date: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    availability: Optional[List[Dict[str, Any]]] = None
    files: Optional[List[Dict[str, str]]] = None
    active: Optional[bool] = None
    photo: Optional[str] = None
    appointment_duration: Optional[int] = None
    password: Optional[str] = None
    lgpd_consent: Optional[bool] = None
    lgpd_consent_date: Optional[str] = None


class VolunteerRead(VolunteerBase):
    id: str

    model_config = ConfigDict(from_attributes=True)
