import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.api.deps import get_session
from app.main import app


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


def test_create_specialty_api(session: Session, client: TestClient):
    payload = {"name": "Dermatologia", "anamnesis_type": "GENERAL"}
    response = client.post("/api/v1/specialties/", json=payload)
    assert response.status_code == 200
    assert response.json()["name"] == "Dermatologia"


def test_read_specialties(session: Session, client: TestClient):
    client.post(
        "/api/v1/specialties/", json={"name": "Pediatria", "anamnesis_type": "GENERAL"}
    )
    response = client.get("/api/v1/specialties/")
    assert len(response.json()) == 1
