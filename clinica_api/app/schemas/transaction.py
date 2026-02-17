from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.transaction_model import PaymentMethod, TransactionType


class TransactionBase(BaseModel):
    amount: float
    type: TransactionType
    description: str
    date: datetime
    patient_id: Optional[str] = None
    appointment_id: Optional[str] = None
    payment_method: PaymentMethod


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[TransactionType] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    payment_method: Optional[PaymentMethod] = None


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[TransactionType] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    patient_id: Optional[str] = None
    appointment_id: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None


class TransactionResponse(TransactionBase):
    id: str
    created_at: datetime


# Stats Schema
class DailyStats(BaseModel):
    total_income: float
    total_expense: float  # Future use
    balance: float
    transaction_count: int
    by_method: dict[str, float]
