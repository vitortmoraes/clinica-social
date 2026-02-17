from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.models.appointment_model import Appointment, AppointmentStatus

router = APIRouter()


@router.post("/appointments/{appointment_id}/confirm")
def confirm_appointment_public(
    appointment_id: str, session: Session = Depends(get_session)
):
    appointment = session.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    # Optional logic: only confirm if currently scheduled?
    # For now, let's just update to CONFIRMED.

    if appointment.status == AppointmentStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Este agendamento foi cancelado.")

    appointment.status = AppointmentStatus.CONFIRMED
    session.add(appointment)
    session.commit()
    session.refresh(appointment)

    return {"message": "Confirmado com sucesso", "status": appointment.status}
