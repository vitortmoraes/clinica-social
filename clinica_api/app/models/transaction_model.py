import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class TransactionType(str, Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"


class PaymentMethod(str, Enum):
    CASH = "DINHEIRO"
    PIX = "PIX"
    CARD = "CARTAO"
    OTHER = "OUTRO"


class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    amount: float
    type: TransactionType
    date: datetime = Field(default_factory=datetime.now)
    description: str
    patient_id: Optional[str] = Field(default=None, foreign_key="patients.id")
    appointment_id: Optional[str] = Field(default=None, foreign_key="appointments.id")
    payment_method: PaymentMethod = Field(default=PaymentMethod.CASH)

    # Audit
    created_at: datetime = Field(default_factory=datetime.now)
    created_by: Optional[str] = None  # User ID who registered
