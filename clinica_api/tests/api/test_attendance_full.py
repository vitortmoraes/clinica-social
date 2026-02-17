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

    # Mockamos que somos o Voluntário "vol1"
    def get_user_override():
        return {"id": "vol1", "role": "volunteer", "name": "Dr. House"}

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[get_current_user] = get_user_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_full_attendance_flow(session: Session, client: TestClient):
    # 1. SETUP: Criar Agendamento + Paciente no Banco
    from app.models.appointment_model import Appointment, AppointmentStatus
    from app.models.patient_model import Patient

    pat = Patient(
        name="Paciente Doente",
        phone="11999",
        birth_date=date(1990, 1, 1),
        cpf="12345678900",
        whatsapp="11999999999",
        personal_income=0,
        family_income=0,
        address={},
    )
    session.add(pat)
    session.commit()

    appt = Appointment(
        id="a_flow",
        patient_id=pat.id,
        volunteer_id="vol1",
        date=date.today(),
        time="10:00",
        status=AppointmentStatus.SCHEDULED,
    )
    session.add(appt)
    session.commit()

    # 2. Ler "Meus Agendamentos"
    resp_my = client.get("/api/v1/attendance/my-appointments")
    assert resp_my.status_code == 200
    assert len(resp_my.json()) >= 1

    # 3. Iniciar Atendimento
    resp_start = client.post("/api/v1/attendance/a_flow/start")
    assert resp_start.status_code == 200
    assert resp_start.json()["status"] == "in_progress"

    # 4. Finalizar com Prontuário
    payload_record = {
        "chief_complaint": "Dor de cabeça",
        "history": "Começou ontem",
        "procedures": "Examinei",
        "prescription": "Dipirona",
        "content": {"obs": "nada grave"},
    }
    # Note: attendance endpoints might not be affected by Trailing Slash removal if they were simple GET/POST on ID
    # but let's be consistent.
    resp_finish = client.post("/api/v1/attendance/a_flow/finish", json=payload_record)
    assert resp_finish.status_code == 200

    # Verifica se status mudou pra FINISHED
    session.refresh(appt)
    assert appt.status == "finished"

    # 5. Ler Histórico do Paciente
    resp_hist = client.get(f"/api/v1/attendance/patient/{pat.id}/history")
    assert resp_hist.status_code == 200
    assert len(resp_hist.json()) == 1
    assert resp_hist.json()[0]["chief_complaint"] == "Dor de cabeça"
