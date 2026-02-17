from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.rate_limiter import limiter
from app.core.security import create_access_token, verify_password
from app.models.user_model import Role, User
from app.models.volunteer_model import Volunteer


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str
    name: str
    specialty: Optional[str] = None


router = APIRouter()


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(
    request: Request, login_data: LoginRequest, session: Session = Depends(get_session)
):
    # 1. Check System Users (Admin/Staff)
    # Note: User model only has 'username', but login form sends 'email'.
    # We treat the input as username for system users.
    query_user = select(User).where(User.username == login_data.email)
    user = session.exec(query_user).first()

    if user:
        valid_password = False
        if user.password == login_data.password:
            valid_password = True
        else:
            try:
                if verify_password(login_data.password, user.password):
                    valid_password = True
            except Exception as e:
                print(f"Erro ao verificar senha (User): {e}")

        if valid_password:
            token = create_access_token(
                subject=user.id, role=user.role.value, name=user.name
            )
            return {
                "access_token": token,
                "token_type": "bearer",
                "role": user.role.value,
                "user_id": user.id,
                "name": user.name,
                "specialty": None,
            }
        else:
            raise HTTPException(status_code=401, detail="Senha incorreta")

    # 2. Check Volunteer (Separate Portal)
    query_vol = select(Volunteer).where(Volunteer.email == login_data.email)
    volunteer = session.exec(query_vol).first()

    if volunteer:
        valid_password = False

        # Check plaintext first
        if volunteer.password == login_data.password:
            valid_password = True
        else:
            # Check hash safely
            try:
                if verify_password(login_data.password, volunteer.password):
                    valid_password = True
            except Exception as e:
                print(f"Erro ao verificar senha (Volunteer): {e}")

        if valid_password:
            token = create_access_token(
                subject=str(volunteer.id), role="volunteer", name=str(volunteer.name)
            )
            return {
                "access_token": token,
                "token_type": "bearer",
                "role": "volunteer",
                "user_id": str(volunteer.id),
                "name": str(volunteer.name),
                "specialty": volunteer.specialty,
            }
        else:
            raise HTTPException(status_code=401, detail="Senha incorreta")

    # Fallback removido (Segurança)
    pass

    raise HTTPException(status_code=401, detail="Usuário não encontrado")
