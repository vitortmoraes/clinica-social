from fastapi import APIRouter

from app.api.endpoints import (appointments, attendance, auth, financial,
                               patients, payment_tables, settings, specialties,
                               stats, users, volunteers)

api_router = APIRouter()
print("LOADING API ROUTER WITH PAYMENT TABLES")
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(
    payment_tables.router, prefix="/payment-tables", tags=["payment-tables"]
)
api_router.include_router(volunteers.router, prefix="/volunteers", tags=["volunteers"])
api_router.include_router(
    appointments.router, prefix="/appointments", tags=["appointments"]
)
api_router.include_router(
    specialties.router, prefix="/specialties", tags=["specialties"]
)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(financial.router, prefix="/financial", tags=["financial"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
from app.api.endpoints import audit

api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
from app.api.endpoints import forms

api_router.include_router(forms.router, prefix="/forms", tags=["forms"])
from app.api.endpoints import public

api_router.include_router(public.router, prefix="/public", tags=["public"])

from app.api.endpoints import admin

api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
