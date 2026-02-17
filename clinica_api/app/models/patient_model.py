import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class Patient(SQLModel, table=True):
    __tablename__ = "patients"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    cpf: str = Field(unique=True, index=True)
    rg: Optional[str] = None
    birth_date: str
    whatsapp: str
    email: Optional[str] = None

    # Armazenando endereço como JSON para simplificar estrutura 1:1
    address: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))

    personal_income: float
    family_income: float
    observations: Optional[str] = None

    files: List[Dict[str, str]] = Field(default=[], sa_column=Column(JSON))
    photo: Optional[str] = None

    active: bool = Field(default=True)

    payment_table_id: Optional[str] = None

    # Responsible fields for minors
    guardian_name: Optional[str] = None
    guardian_cpf: Optional[str] = None
    guardian_phone: Optional[str] = None

    # LGPD
    lgpd_consent: Optional[bool] = Field(default=False)
    lgpd_consent_date: Optional[str] = None
