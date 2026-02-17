import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.api.deps import get_session
from app.main import app


# Fixture Padrão (Banco em Memória)
@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    # "Enganamos" a API para ela achar que já estamos logados como Admin
    def get_user_override():
        return {"id": "admin1", "role": "ADMIN", "name": "Admin Tester"}

    app.dependency_overrides[get_session] = get_session_override

    # IMPORTANTE: A rota users.py usa o security.py, não deps.py!
    from app.core.security import get_current_user

    app.dependency_overrides[get_current_user] = get_user_override

    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_user_crud_api(session: Session, client: TestClient):
    # 1. CREATE (POST)
    payload = {
        "name": "Novo Usuário API",
        "username": "api@clinica.com",
        "password": "123",
        "role": "STAFF",
    }
    response = client.post("/api/v1/users/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "api@clinica.com"
    user_id = data["id"]

    # 2. READ (GET)
    response_list = client.get("/api/v1/users/")
    assert response_list.status_code == 200
    users = response_list.json()
    assert len(users) >= 1
    assert any(u["id"] == user_id for u in users)


def test_update_user(session: Session, client: TestClient):
    # Setup
    from app.models.user_model import Role, User

    u = User(
        id="u_upd",
        name="Antigo",
        username="antigo@teste.com",
        password="123",
        role=Role.STAFF,
    )
    session.add(u)
    session.commit()

    # Update
    payload = {"name": "Novo Nome", "role": "ADMIN"}
    resp = client.put("/api/v1/users/u_upd", json=payload)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Novo Nome"
    assert resp.json()["role"] == "ADMIN"


def test_delete_user(session: Session, client: TestClient):
    # Setup
    from app.models.user_model import Role, User

    u = User(
        id="u_del",
        name="Deletar",
        username="del@teste.com",
        password="123",
        role=Role.STAFF,
    )
    session.add(u)
    session.commit()

    # Delete
    resp = client.delete("/api/v1/users/u_del")
    assert resp.status_code == 200
    assert resp.json()["ok"] is True

    # Verify
    resp_get = client.get("/api/v1/users/")
    users = resp_get.json()
    assert not any(u["id"] == "u_del" for u in users)
