from typing import Optional

from pydantic import BaseModel


class PaymentTableBase(BaseModel):
    name: str
    value: float


class PaymentTableCreate(PaymentTableBase):
    pass


class PaymentTable(PaymentTableBase):
    id: str

    class Config:
        from_attributes = True
