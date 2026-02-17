from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.audit_model import AuditLog
from app.models.user_model import User

router = APIRouter()


@router.get("/", response_model=List[AuditLog])
def get_audit_logs(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    limit: int = 100,
    offset: int = 0,
    user_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    query = select(AuditLog).order_by(AuditLog.timestamp.desc())

    if user_id:
        query = query.where(AuditLog.user_id == user_id)

    if start_date:
        query = query.where(AuditLog.timestamp >= start_date)

    if end_date:
        # Append time to cover the whole day if only date is provided
        if len(end_date) == 10:  # YYYY-MM-DD
            end_date = f"{end_date} 23:59:59"
        query = query.where(AuditLog.timestamp <= end_date)

    query = query.offset(offset).limit(limit)
    results = session.exec(query).all()
    print(
        f"DEBUG AUDIT: user_id={user_id}, start={start_date}, end={end_date}, found={len(results)}"
    )
    return results
