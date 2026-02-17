from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MedicalRecordBase(BaseModel):
    chief_complaint: str
    history: str
    procedures: Optional[str] = None
    prescription: Optional[str] = None
    content: Optional[dict] = None  # JSON Content for specialized forms


class MedicalRecordCreate(MedicalRecordBase):
    pass


class MedicalRecordRead(MedicalRecordBase):
    id: str
    appointment_id: str
    patient_id: str
    volunteer_id: str
    created_at: datetime
