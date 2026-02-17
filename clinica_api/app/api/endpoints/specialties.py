from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.specialty_model import Specialty
from app.schemas.specialty import Specialty as SpecialtySchema
from app.schemas.specialty import SpecialtyCreate

router = APIRouter()


@router.post("/", response_model=SpecialtySchema)
def create_specialty(
    specialty: SpecialtyCreate, session: Session = Depends(get_session)
):
    db_specialty = Specialty.model_validate(specialty)
    session.add(db_specialty)
    session.commit()
    session.refresh(db_specialty)
    return db_specialty


@router.get("/", response_model=List[SpecialtySchema])
def read_specialties(session: Session = Depends(get_session)):
    specialties = session.exec(select(Specialty)).all()
    return specialties


@router.delete("/{specialty_id}")
def delete_specialty(specialty_id: str, session: Session = Depends(get_session)):
    specialty = session.get(Specialty, specialty_id)
    if not specialty:
        raise HTTPException(status_code=404, detail="Specialty not found")
    session.delete(specialty)
    session.commit()
    return {"ok": True}


@router.put("/{specialty_id}", response_model=SpecialtySchema)
def update_specialty(
    specialty_id: str,
    specialty: SpecialtyCreate,
    session: Session = Depends(get_session),
):
    db_specialty = session.get(Specialty, specialty_id)
    if not db_specialty:
        raise HTTPException(status_code=404, detail="Specialty not found")

    specialty_data = specialty.model_dump(exclude_unset=True)
    for key, value in specialty_data.items():
        setattr(db_specialty, key, value)

    session.add(db_specialty)
    session.commit()
    session.refresh(db_specialty)
    return db_specialty
