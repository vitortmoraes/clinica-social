from typing import Optional

from fastapi import Request
from sqlmodel import Session
from starlette.background import BackgroundTask
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.database import engine
from app.models.audit_model import AuditLog


# Sync function to run in threadpool
def log_audit_action(
    user_id: str,
    user_name: str,
    method: str,
    resource: str,
    resource_id: Optional[str],
    ip: str,
    path: str,
    status: int,
):
    try:
        with Session(engine) as session:
            log = AuditLog(
                user_id=user_id,
                user_name=user_name,
                action=method,
                resource=resource,
                resource_id=resource_id,
                ip_address=ip,
                details=f"Path: {path} | Status: {status}",
            )
            session.add(log)
            session.commit()
    except Exception as e:
        print(f"Audit Log Error: {e}")


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Filter sensitive routes
        # Filter sensitive routes
        # Manual logging implemented for creation/updates on: patients, volunteers
        # We keep GET (read access) logging for everything.

        path = request.url.path
        method = request.method

        should_log = False

        # 1. Automatic logging for everything (Financial, Medical Records) if not manually instrumented yet
        if any(p in path for p in ["/medical-records", "/financial"]):
            if method in ["POST", "PUT", "DELETE", "GET"]:
                should_log = True

        # 2. For manually instrumented resources, only log GET (Read Access) automatically
        #    Modifications are logged by the endpoint itself with better details.
        elif any(p in path for p in ["/patients", "/volunteers"]):
            if method == "GET":
                should_log = True

        # Debug Print
        # print(f"DEBUG MIDDLEWARE: path={path}, method={method}, should_log={should_log}")

        if should_log:
            try:
                # Extract User
                auth = request.headers.get("Authorization")
                user_id = "anonymous"
                user_name = "Anonymous"

                if auth and auth.startswith("Bearer "):
                    try:
                        token = auth.split(" ")[1]
                        from jose import jwt

                        from app.core.security import ALGORITHM, SECRET_KEY

                        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                        user_id = payload.get("sub")
                        user_name = payload.get("name") or payload.get("sub")
                    except Exception:
                        pass

                # Extract Resource ID
                path_parts = request.url.path.strip("/").split("/")
                # Skip api/v1 prefixes to get real resource name
                relevant_parts = [p for p in path_parts if p not in ["api", "v1"]]

                resource = relevant_parts[0] if len(relevant_parts) > 0 else "unknown"
                resource_id = relevant_parts[1] if len(relevant_parts) > 1 else None

                # Only log authenticated actions or specific conditions
                # Ignore Redirects (307/308) to avoid duplication
                if user_id != "anonymous" and response.status_code not in [307, 308]:
                    # Use BackgroundTask to run sync DB operation without blocking loop
                    # Note: If response already has background task, this might overwrite it.
                    # For this system's current complexity, this is acceptable.
                    task = BackgroundTask(
                        log_audit_action,
                        user_id=user_id,
                        user_name=user_name,
                        method=request.method,
                        resource=resource,
                        resource_id=resource_id,
                        ip=request.client.host,
                        path=request.url.path,
                        status=response.status_code,
                    )
                    response.background = task

            except Exception as e:
                print(f"Audit Middleware Error: {e}")

        return response
