import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.appointment_model import Appointment
from app.schemas.appointment import (AppointmentCreate, AppointmentRead,
                                     AppointmentUpdate)

router = APIRouter()


@router.get("", response_model=List[AppointmentRead])
def read_appointments(
    volunteer_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    date: Optional[str] = None,
    session: Session = Depends(get_session),
):
    query = select(Appointment)
    if volunteer_id:
        query = query.where(Appointment.volunteer_id == volunteer_id)
    if patient_id:
        query = query.where(Appointment.patient_id == patient_id)
    if date:
        query = query.where(Appointment.date == date)

    appointments = session.exec(query).all()
    return appointments


@router.get("/{appointment_id}", response_model=AppointmentRead)
def read_appointment(appointment_id: str, session: Session = Depends(get_session)):
    appointment = session.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("", response_model=AppointmentRead)
def create_appointment(
    appointment_in: AppointmentCreate, session: Session = Depends(get_session)
):
    # Check availability (Conflict Detection) only if volunteer is assigned
    if appointment_in.volunteer_id:
        # Ensure no other appointment exists for this volunteer at this date/time with status 'scheduled'
        query = select(Appointment).where(
            Appointment.volunteer_id == appointment_in.volunteer_id,
            Appointment.date == appointment_in.date,
            Appointment.time == appointment_in.time,
            Appointment.status == "scheduled",
        )
        existing = session.exec(query).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail="Horário indisponível. Já existe um agendamento.",
            )

    db_appointment = Appointment.model_validate(appointment_in.model_dump())
    db_appointment.id = str(uuid.uuid4())

    session.add(db_appointment)
    session.commit()
    session.refresh(db_appointment)
    return db_appointment


@router.put("/{appointment_id}", response_model=AppointmentRead)
def update_appointment(
    appointment_id: str,
    appointment_in: AppointmentUpdate,
    session: Session = Depends(get_session),
):
    db_appointment = session.get(Appointment, appointment_id)
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    data = appointment_in.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(db_appointment, key, value)

    session.add(db_appointment)
    session.commit()
    session.refresh(db_appointment)
    return db_appointment


@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: str, session: Session = Depends(get_session)):
    db_appointment = session.get(Appointment, appointment_id)
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Delete linked transactions first to avoid FK constraint error
    from app.models.transaction_model import Transaction

    transactions = session.exec(
        select(Transaction).where(Transaction.appointment_id == appointment_id)
    ).all()
    for t in transactions:
        session.delete(t)

    session.flush()  # Ensure transactions are deleted before the appointment

    session.delete(db_appointment)
    session.commit()
    return
