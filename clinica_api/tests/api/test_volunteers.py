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
    app.dependency_overrides[get_session] = lambda: session
    return TestClient(app)


def test_read_volunteers_empty(session: Session, client: TestClient):
    # Banco está vazio
    response = client.get("/api/v1/volunteers/")
    assert response.status_code == 200
    assert response.json() == []  # Lista vazia


def test_create_volunteer_api(session: Session, client: TestClient):
    # Teste de Integração (API): Simula uma chamada real HTTP POST
    payload = {
        "name": "Dra. Teste API",
        "email": "dra.api@teste.com",
        "specialty": "Cardio",
        "password": "123",
        "birth_date": "1990-01-01",  # Formato ISO string para JSON
        "phone": "11999999999",
        "license_number": "CRM-API-123",
        "active": True,
    }

    response = client.post("/api/v1/volunteers/", json=payload)

    # Assert (Verificação)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Dra. Teste API"
    assert data["id"] is not None

    # Verifica se realmente salvou no banco
    from app.models.volunteer_model import Volunteer

    vol_db = session.get(Volunteer, data["id"])
    assert vol_db is not None
    assert vol_db.email == "dra.api@teste.com"
