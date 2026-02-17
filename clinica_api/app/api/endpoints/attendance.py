from datetime import datetime
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, desc, select

from app.api.deps import get_current_user
from app.core.database import get_session
from app.models.appointment_model import Appointment, AppointmentStatus
from app.models.medical_record_model import MedicalRecord
from app.schemas.appointment import AppointmentRead
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordRead

router = APIRouter()

from app.models.patient_model import Patient
from app.models.specialty_model import Specialty
from app.models.volunteer_model import Volunteer
from app.schemas.appointment import AppointmentVolunteerRead


@router.get("/my-appointments", response_model=List[AppointmentVolunteerRead])
def get_my_appointments(
    current_user: Any = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user["role"] != "volunteer":
        raise HTTPException(status_code=403, detail="Acesso apenas para voluntários")

    volunteer_id = current_user["id"]

    # Join with Patient to get name
    query = (
        select(Appointment, Patient.name)
        .join(Patient)
        .where(
            Appointment.volunteer_id == volunteer_id,
            Appointment.status.in_(
                [
                    AppointmentStatus.SCHEDULED,
                    AppointmentStatus.NOT_STARTED,
                    AppointmentStatus.IN_PROGRESS,
                    AppointmentStatus.FINISHED,
                    AppointmentStatus.CONFIRMED,
                ]
            ),
        )
        .order_by(Appointment.date, Appointment.time)
    )

    results = session.exec(query).all()

    # Map results to Schema because we are returning (Appointment, patient_name) tuple
    appointments_with_names = []
    for appt, pat_name in results:
        # Create dict from appt model and add patient_name
        appt_dict = appt.model_dump()
        appt_dict["patient_name"] = pat_name
        appointments_with_names.append(appt_dict)

    return appointments_with_names


@router.post("/{appointment_id}/start", response_model=AppointmentRead)
def start_attendance(
    appointment_id: str,
    current_user: Any = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user["role"] != "volunteer":
        raise HTTPException(status_code=403, detail="Acesso apenas para voluntários")

    appt = session.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    if appt.volunteer_id != current_user["id"]:
        raise HTTPException(
            status_code=403, detail="Este agendamento pertence a outro profissional"
        )

    appt.status = AppointmentStatus.IN_PROGRESS
    session.add(appt)
    session.commit()
    session.refresh(appt)
    return appt


@router.post("/{appointment_id}/finish", response_model=MedicalRecordRead)
def finish_attendance(
    appointment_id: str,
    record_in: MedicalRecordCreate,
    current_user: Any = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user["role"] != "volunteer":
        raise HTTPException(status_code=403, detail="Acesso apenas para voluntários")

    appt = session.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    if appt.volunteer_id != current_user["id"]:
        raise HTTPException(
            status_code=403, detail="Este agendamento pertence a outro profissional"
        )

    # 1. Update Appointment Status
    appt.status = AppointmentStatus.FINISHED
    session.add(appt)

    # 2. Create or Update Medical Record
    existing_record = session.exec(
        select(MedicalRecord).where(MedicalRecord.appointment_id == appointment_id)
    ).first()

    if existing_record:
        # Update existing
        existing_record.chief_complaint = record_in.chief_complaint
        existing_record.history = record_in.history
        existing_record.procedures = record_in.procedures
        existing_record.prescription = record_in.prescription
        existing_record.content = record_in.content  # Fix: update content (JSON)
        # volunteer_id remains the original one or update it? Let's update to current user (editor)
        existing_record.volunteer_id = current_user["id"]
        db_record = existing_record
        session.add(db_record)
    else:
        # Create new
        db_record = MedicalRecord(
            appointment_id=appointment_id,
            patient_id=appt.patient_id,
            volunteer_id=current_user["id"],
            **record_in.dict()
        )
        session.add(db_record)

    try:
        session.commit()
        session.refresh(db_record)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return db_record


@router.get("/patient/{patient_id}/history", response_model=List[MedicalRecordRead])
def get_patient_history(
    patient_id: str,
    current_user: Any = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user["role"] not in ["volunteer", "admin", "staff"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    # Check if patient exists? Optional, query returns empty list if not.
    # Join with User (Volunteer) to get doctor name? Maybe later for UI.

    query = (
        select(MedicalRecord)
        .where(MedicalRecord.patient_id == patient_id)
        .order_by(desc(MedicalRecord.created_at))
    )

    records = session.exec(query).all()
    return records


@router.post("/{appointment_id}/cancel", response_model=AppointmentRead)
def cancel_attendance_start(
    appointment_id: str,
    current_user: Any = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user["role"] != "volunteer":
        raise HTTPException(status_code=403, detail="Acesso apenas para voluntários")

    appt = session.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    if appt.volunteer_id != current_user["id"]:
        raise HTTPException(
            status_code=403, detail="Este agendamento pertence a outro profissional"
        )

    # Revert to SCHEDULED (or NOT_STARTED)
    appt.status = AppointmentStatus.SCHEDULED
    session.add(appt)
    session.commit()
    session.refresh(appt)
    return appt


@router.get("/{appointment_id}/record")
def get_appointment_record(
    appointment_id: str,
    current_user: Any = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Allow both admin and volunteer to view records

    appt = session.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    patient = session.get(Patient, appt.patient_id)
    volunteer = session.get(Volunteer, appt.volunteer_id)

    # Get the latest record for this appointment
    # Get the latest record for this appointment
    record = session.exec(
        select(MedicalRecord).where(MedicalRecord.appointment_id == appointment_id)
    ).first()

    anamnesis_type = "general"
    if volunteer and volunteer.specialty:
        spec_obj = session.exec(
            select(Specialty).where(Specialty.name == volunteer.specialty)
        ).first()
        if spec_obj:
            anamnesis_type = spec_obj.anamnesis_type

    return {
        "appointment": appt,
        "patient": patient,
        "volunteer": volunteer,
        "record": record,
        "anamnesis_type": anamnesis_type,
    }
