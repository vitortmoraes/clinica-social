from datetime import date, timedelta
from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.patient_model import Patient
from app.models.volunteer_model import Volunteer

router = APIRouter()


@router.get("/birthdays", response_model=List[Dict[str, Any]])
def get_birthdays(session: Session = Depends(get_session)):
    today = date.today()
    next_week = today + timedelta(days=7)

    # We want birthdays between today and next_week (inclusive? let's say 7 days horizon)
    # Since years differ, we must compare (month, day).

    results = []

    # 1. Patients
    patients = session.exec(select(Patient).where(Patient.active == True)).all()
    for p in patients:
        try:
            # birth_date string YYYY-MM-DD
            b_date = date.fromisoformat(p.birth_date)

            # Calculate next birthday
            # Try current year
            this_year_bday = date(today.year, b_date.month, b_date.day)

            if this_year_bday < today:
                # Birthday passed this year, check next year?
                # Request is "Birthdays of the Week", implies mostly upcoming in current cycle.
                # If today is Dec 30, and bday is Jan 2, next bday is Jan 2 next year.
                this_year_bday = date(today.year + 1, b_date.month, b_date.day)

            # Check if within range
            if today <= this_year_bday <= next_week:
                results.append(
                    {
                        "id": p.id,
                        "name": p.name,
                        "type": "Paciente",
                        "date": f"{this_year_bday.day:02d}/{this_year_bday.month:02d}",
                        "formatted_date": this_year_bday.strftime("%d/%m"),
                        "is_today": (this_year_bday == today),
                    }
                )

        except ValueError:
            pass  # Invalid date format

    # 2. Volunteers
    volunteers = session.exec(select(Volunteer).where(Volunteer.active == True)).all()
    for v in volunteers:
        try:
            b_date = date.fromisoformat(v.birth_date)
            this_year_bday = date(today.year, b_date.month, b_date.day)

            if this_year_bday < today:
                this_year_bday = date(today.year + 1, b_date.month, b_date.day)

            if today <= this_year_bday <= next_week:
                results.append(
                    {
                        "id": v.id,
                        "name": v.name,
                        "type": "Voluntário",
                        "date": f"{this_year_bday.day:02d}/{this_year_bday.month:02d}",
                        "formatted_date": this_year_bday.strftime("%d/%m"),
                        "is_today": (this_year_bday == today),
                    }
                )
        except ValueError:
            pass

    # Sort by date
    results.sort(
        key=lambda x: (int(x["date"].split("/")[1]), int(x["date"].split("/")[0]))
    )

    return results
