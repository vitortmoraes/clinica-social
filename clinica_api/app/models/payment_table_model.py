import uuid
from typing import Optional

from sqlmodel import Field, SQLModel


class PaymentTable(SQLModel, table=True):
    __tablename__ = "payment_tables"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True)
    value: float
