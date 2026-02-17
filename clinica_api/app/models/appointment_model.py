import uuid
from datetime import date, time
from typing import Optional

from sqlmodel import Field, SQLModel


class Appointment(SQLModel, table=True):
    __tablename__ = "appointments"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patients.id", index=True)
    volunteer_id: Optional[str] = Field(
        default=None, foreign_key="volunteers.id", index=True
    )
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    status: str = Field(
        default="scheduled"
    )  # scheduled, not_started, in_progress, finished, cancelled, absent
    notes: Optional[str] = None
    price: float = Field(default=0.0)  # Snapshot of price at booking time
    amount_paid: float = Field(default=0.0)  # Total amount paid so far
    payment_status: str = Field(default="PENDING")  # PENDING, PARTIAL, PAID


# Constants for Status
class AppointmentStatus:
    SCHEDULED = "scheduled"
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"
    CANCELLED = "cancelled"
    ABSENT = "absent"
    CONFIRMED = "confirmed"
