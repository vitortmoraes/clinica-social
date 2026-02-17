from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.user_model import Role, User

router = APIRouter()


class UserCreate(BaseModel):
    name: str
    username: str
    password: str
    role: Role


class UserRead(BaseModel):
    id: str
    name: str
    username: str
    role: Role


@router.get("/", response_model=List[UserRead])
def read_users(
    session: Session = Depends(get_session),
    current_user: Any = Depends(get_current_user),
):
    if current_user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Acesso negado")
    users = session.exec(select(User)).all()
    return users


@router.post("/", response_model=UserRead)
def create_user(
    user_in: UserCreate,
    session: Session = Depends(get_session),
    current_user: Any = Depends(get_current_user),
):
    print(f"DEBUG: create_user called by {current_user}")
    if current_user["role"] != "ADMIN":
        print(f"DEBUG: Denied. Role is '{current_user['role']}' vs expected 'ADMIN'")
        raise HTTPException(status_code=403, detail="Acesso negado")

    # Check if username exists
    existing = session.exec(
        select(User).where(User.username == user_in.username)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Usuário já existe")

    user = User(
        name=user_in.name,
        username=user_in.username,
        password=user_in.password,  # Plain text as per current simplified auth logic
        role=user_in.role,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


class UserUpdate(BaseModel):
    name: str | None = None
    username: str | None = None
    password: str | None = None
    role: Role | None = None


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    session: Session = Depends(get_session),
    current_user: Any = Depends(get_current_user),
):
    if current_user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Acesso negado")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if user_in.name:
        user.name = user_in.name
    if user_in.username:
        # Check uniqueness if username changing
        if user_in.username != user.username:
            existing = session.exec(
                select(User).where(User.username == user_in.username)
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Nome de usuário já existe")
        user.username = user_in.username
    if user_in.password:
        user.password = user_in.password
    if user_in.role:
        user.role = user_in.role

    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    session: Session = Depends(get_session),
    current_user: Any = Depends(get_current_user),
):
    if current_user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Acesso negado")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Prevent deleting yourself?
    if user.id == current_user["id"]:
        raise HTTPException(
            status_code=400, detail="Não é possível excluir seu próprio usuário"
        )

    session.delete(user)
    session.commit()
    return {"ok": True}
