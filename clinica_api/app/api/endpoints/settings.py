from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, SQLModel, select

from app.core.database import get_session
from app.models.clinic_settings import ClinicSettings

router = APIRouter()


@router.get("/", response_model=dict)
def get_settings(session: Session = Depends(get_session)):
    settings = session.exec(select(ClinicSettings)).first()
    if not settings:
        # Create default if not exists
        settings = ClinicSettings(
            clinic_name="Clínica Cuidar", address="Endereço Padrão"
        )
        session.add(settings)
        session.commit()
        session.refresh(settings)

    # Convert to dict
    settings_dict = settings.dict()

    return settings_dict


class SettingsUpdate(SQLModel):
    clinic_name: str | None = None
    company_name: str | None = None
    cnpj: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None
    city: str | None = None

    # Backup Config
    backup_frequency: str | None = None
    backup_time: str | None = None


@router.put("/", response_model=dict)
def update_settings(
    settings_in: SettingsUpdate, session: Session = Depends(get_session)
):
    # Simple singleton update
    # We find the existing ONE record (or create) and update it
    # We use settings_in.id but actually we should just update the first record

    current_settings = session.exec(select(ClinicSettings)).first()
    if not current_settings:
        current_settings = ClinicSettings()  # Should assume validation passed
        session.add(current_settings)

    # Update fields (ORM)
    current_settings.clinic_name = settings_in.clinic_name
    current_settings.company_name = settings_in.company_name
    current_settings.cnpj = settings_in.cnpj
    current_settings.address = settings_in.address
    current_settings.phone = settings_in.phone
    current_settings.email = settings_in.email
    current_settings.website = settings_in.website
    current_settings.logo_url = settings_in.logo_url
    current_settings.primary_color = settings_in.primary_color

    if settings_in.backup_frequency is not None:
        current_settings.backup_frequency = settings_in.backup_frequency
    if settings_in.backup_time is not None:
        current_settings.backup_time = settings_in.backup_time

    # City is updated via raw SQL below

    session.add(current_settings)
    session.commit()
    session.refresh(current_settings)

    # Reschedule Backup Jobs
    from app.services.backup_service import BackupService

    BackupService.reschedule_jobs()

    # Raw SQL Update for City
    if settings_in.city is not None:
        try:
            session.connection().execute(
                text("UPDATE clinic_settings SET city = :city WHERE id = :id"),
                {"city": settings_in.city, "id": current_settings.id},
            )
            session.commit()
        except Exception as e:
            print(f"Error updating raw city: {e}")

    # Construct response
    settings_dict = current_settings.dict()
    settings_dict["city"] = settings_in.city  # Return what we just saved (optimistic)

    return settings_dict
