from typing import Optional

from pydantic import BaseModel, ConfigDict


# Base for shared properties
class AppointmentBase(BaseModel):
    patient_id: str
    volunteer_id: Optional[str] = None
    date: str
    time: str
    status: Optional[str] = "scheduled"
    notes: Optional[str] = None
    price: Optional[float] = 0.0
    amount_paid: Optional[float] = 0.0
    payment_status: Optional[str] = "PENDING"


# Properties to receive on creation
class AppointmentCreate(AppointmentBase):
    pass


# Properties to receive on update
class AppointmentUpdate(BaseModel):
    patient_id: Optional[str] = None
    volunteer_id: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    price: Optional[float] = None
    amount_paid: Optional[float] = None
    payment_status: Optional[str] = None


# Properties to return to client
class AppointmentRead(AppointmentBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


class AppointmentVolunteerRead(AppointmentRead):
    patient_name: str
