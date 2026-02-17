import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class MedicalRecord(SQLModel, table=True):
    __tablename__ = "medical_records"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    appointment_id: str = Field(foreign_key="appointments.id", index=True, unique=True)
    patient_id: str = Field(foreign_key="patients.id", index=True)
    volunteer_id: str = Field(foreign_key="volunteers.id", index=True)

    # Prontuário Fields
    chief_complaint: str  # Queixa Principal
    history: str  # Evolução / Histórico
    procedures: Optional[
        str
    ] = None  # Procedimentos Realizados (Texto livre por enquanto)
    prescription: Optional[str] = None  # Prescrição
    content: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
