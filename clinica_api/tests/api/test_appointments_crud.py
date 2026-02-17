from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.api.deps import get_current_user, get_session
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
    def get_session_override():
        return session

    def get_user_override():
        return {"id": "admin", "role": "ADMIN", "name": "Admin"}

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[get_current_user] = get_user_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_list_delete_appointments(session: Session, client: TestClient):
    # Setup
    from app.models.appointment_model import Appointment, AppointmentStatus

    appt = Appointment(
        id="a_del",
        patient_id="p1",
        volunteer_id="v1",
        date=date.today(),
        time="10:00",
        status=AppointmentStatus.SCHEDULED,
    )
    session.add(appt)
    session.commit()

    # Listar
    resp = client.get("/api/v1/appointments/")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    # Deletar
    resp_del = client.delete("/api/v1/appointments/a_del")
    assert resp_del.status_code == 204  # 204 No Content is standard for delete

    # Confirmar deleção
    resp_get = client.get("/api/v1/appointments/a_del")
    assert resp_get.status_code == 404
