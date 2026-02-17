import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.user_model import User
from app.models.volunteer_model import Volunteer
from app.schemas.volunteer import (VolunteerCreate, VolunteerRead,
                                   VolunteerUpdate)
from app.services.audit_service import create_audit_log

router = APIRouter()


@router.get("/", response_model=List[VolunteerRead])
def read_volunteers(session: Session = Depends(get_session)):
    volunteers = session.exec(select(Volunteer).where(Volunteer.active == True)).all()
    return volunteers


@router.post("/", response_model=VolunteerRead)
def create_volunteer(
    volunteer_in: VolunteerCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_volunteer = Volunteer.model_validate(volunteer_in.model_dump())
    # TODO: Hash password before saving in production
    db_volunteer.id = str(uuid.uuid4())
    db_volunteer.active = True

    session.add(db_volunteer)
    session.commit()
    session.refresh(db_volunteer)

    create_audit_log(
        session,
        current_user,
        "CREATE",
        "Volunteer",
        db_volunteer.id,
        {"name": db_volunteer.name},
    )
    session.commit()

    return db_volunteer


@router.put("/{volunteer_id}", response_model=VolunteerRead)
def update_volunteer(
    volunteer_id: str,
    volunteer_in: VolunteerUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_volunteer = session.get(Volunteer, volunteer_id)
    if not db_volunteer or not db_volunteer.active:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    volunteer_data = volunteer_in.model_dump(exclude_unset=True)
    for key, value in volunteer_data.items():
        setattr(db_volunteer, key, value)

    session.add(db_volunteer)
    session.commit()
    session.refresh(db_volunteer)

    create_audit_log(
        session,
        current_user,
        "UPDATE",
        "Volunteer",
        db_volunteer.id,
        {"name": db_volunteer.name, "changes": list(volunteer_data.keys())},
    )
    session.commit()

    return db_volunteer


@router.delete("/{volunteer_id}", status_code=204)
def delete_volunteer(
    volunteer_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_volunteer = session.get(Volunteer, volunteer_id)
    if not db_volunteer or not db_volunteer.active:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    # Check for linked appointments
    # Check for linked appointments
    from app.models.appointment_model import Appointment

    existing_appts = session.exec(
        select(Appointment).where(Appointment.volunteer_id == volunteer_id)
    ).first()
    if existing_appts:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir. Voluntário possui agendamentos vinculados.",
        )

    # Capture data before modification
    volunteer_name = db_volunteer.name
    print(f"DEBUG: Soft deleting volunteer {volunteer_name} ({volunteer_id})")

    # Soft Delete Implementation
    db_volunteer.active = False
    session.add(db_volunteer)
    session.commit()

    try:
        create_audit_log(
            session,
            current_user,
            "DELETE (SOFT)",
            "Volunteer",
            volunteer_id,
            {"name": volunteer_name},
        )
        session.commit()
        print(f"DEBUG: Audit log created for deletion of {volunteer_name}")
    except Exception as e:
        print(f"ERROR: Failed to create audit log for deletion: {e}")

    return
