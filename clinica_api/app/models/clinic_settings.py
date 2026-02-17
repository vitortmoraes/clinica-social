import uuid
from typing import Optional

from sqlmodel import Field, SQLModel


class ClinicSettings(SQLModel, table=True):
    __tablename__ = "clinic_settings"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    clinic_name: str = Field(default="Minha Clínica")  # Nome Fantasia
    company_name: Optional[str] = None  # Razão Social
    cnpj: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None  # URL or Base64 string
    primary_color: str = Field(default="#059669")  # Green-600 default

    # Backup Configuration
    backup_frequency: str = Field(default="manual")  # manual, daily, weekly
    backup_time: str = Field(default="03:00")  # HH:MM
    last_backup_at: Optional[str] = None  # ISO format datetime
