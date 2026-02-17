import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    user_name: str
    action: str  # ex: "VIEW", "CREATE", "DELETE", "LOGIN"
    resource: str  # ex: "Patient", "MedicalRecord", "Financial"
    resource_id: Optional[str] = None
    details: Optional[str] = None  # JSON string com detalhes extras
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
