from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.core.database import get_session
from app.models.form_template import (FormTemplate, FormTemplateCreate,
                                      FormTemplateRead)

router = APIRouter()


@router.post("/templates", response_model=FormTemplateRead)
def create_template(
    template: FormTemplateCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    # Future: Check if admin
    db_template = FormTemplate.model_validate(template)
    session.add(db_template)
    session.commit()
    session.refresh(db_template)
    return db_template


@router.get("/templates", response_model=List[FormTemplateRead])
def read_templates(
    specialty: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    query = select(FormTemplate).where(FormTemplate.active == True)

    # Filter logic:
    # If template has empty specialties [], it's for everyone.
    # If it has ["nutritionist"], only show if user specialty matches or if param matches.
    # For now, we return all and let frontend filter, OR we can filter here.
    # Let's return all for now to keep it simple, or filter by exact match if provided.

    templates = session.exec(query).all()

    if specialty:
        # Python side filtering for JSON array containment if needed,
        # but for now let's just return all and let frontend decide or
        # implement basic filtering if specialty is strictly required.
        pass

    return templates


@router.delete("/templates/{template_id}")
def delete_template(
    template_id: str,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    template = session.get(FormTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    session.delete(template)
    session.commit()
    return {"ok": True}


@router.put("/templates/{template_id}", response_model=FormTemplateRead)
def update_template(
    template_id: str,
    template_update: FormTemplateCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    db_template = session.get(FormTemplate, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    update_data = template_update.model_dump(exclude_unset=True)
    db_template.sqlmodel_update(update_data)

    session.add(db_template)
    session.commit()
    session.refresh(db_template)
    return db_template
