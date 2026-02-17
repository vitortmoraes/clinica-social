import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class FormTemplateBase(SQLModel):
    title: str
    type: str = Field(default="dynamic")  # static, dynamic
    schema_config: Dict[str, Any] = Field(
        default={}, sa_column=Column(JSON)
    )  # Renamed from schema to avoid conflict
    specialties: List[str] = Field(
        default=[], sa_column=Column(JSON)
    )  # ["nutritionist", "medical_doctor"]
    description: Optional[str] = None


class FormTemplate(FormTemplateBase, table=True):
    __tablename__ = "form_templates"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    active: bool = Field(default=True)


class FormTemplateCreate(FormTemplateBase):
    pass


class FormTemplateRead(FormTemplateBase):
    id: str
    created_at: datetime
    active: bool
