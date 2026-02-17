import json

from sqlmodel import Session

from app.models.audit_model import AuditLog
from app.models.user_model import User


def create_audit_log(
    session: Session,
    user: User,
    action: str,
    resource: str,
    resource_id: str = None,
    details: dict = None,
):
    """
    Creates an audit log entry.
    """
    try:
        # User might be a dict (from token) or an object (from DB)
        user_id = getattr(user, "id", None) or user.get("id")
        user_name = getattr(user, "name", None) or user.get("name")

        log_entry = AuditLog(
            user_id=str(user_id),
            user_name=str(user_name),
            action=action,
            resource=resource,
            resource_id=str(resource_id) if resource_id else None,
            details=json.dumps(details) if details else None,
        )
        print(
            f"DEBUG AUDIT SERVICE: Created log for {action} on {resource} by {user_name}"
        )
        session.add(log_entry)
        # We don't commit here to allow the caller to commit as part of their transaction
        # But for audit logs, sometimes we want them even if the main transaction fails?
        # Usually checking 'success' actions implies the transaction succeeded.
        # Let's let the caller commit or we commit user specific logs?
        # For simplicity and consistency with transaction, we add to session.
        session.add(log_entry)
    except Exception as e:
        print(f"Failed to create audit log: {e}")
