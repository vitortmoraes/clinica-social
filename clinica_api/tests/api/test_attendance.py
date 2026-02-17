# Primeiro fazemos as importações necessárias das bibliotecas que vamos usar
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.api.deps import get_current_user, get_session
from app.main import app


# Configuração igual ao anterior (Banco em Memória de "mentirinha")
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


# Fixture do Cliente (Simula o Navegador/Postman)
@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    # "Enganamos" a API para ela achar que já estamos logados como Voluntário
    def get_user_override():
        return {"id": "vol1", "role": "volunteer", "name": "Dr. Teste"}

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[get_current_user] = get_user_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_start_attendance_success(session: Session, client: TestClient):
    # 1. CENÁRIO (ARRANGE): Criar agendamento no banco
    # Precisamos usar SQL direto pois a API exige login real pra criar
    from app.models.appointment_model import Appointment, AppointmentStatus

    appt = Appointment(
        id="a1",
        patient_id="p1",
        volunteer_id="vol1",
        date="2023-10-10",
        time="10:00",
        status=AppointmentStatus.SCHEDULED,
    )
    session.add(appt)
    session.commit()

    # 2. AÇÃO (ACT): Tentar iniciar o atendimento chamando a rota da API
    # Simulamos um POST para /start
    response = client.post("/api/v1/attendance/a1/start")

    # 3. VERIFICAÇÃO (ASSERT):
    # Código 200 = Sucesso
    assert response.status_code == 200

    # O JSON retornado deve ter o status atualizado para 'in_progress'
    data = response.json()
    assert data["status"] == "in_progress"


def test_start_attendance_wrong_doctor(session: Session, client: TestClient):
    # Cenário: Agendamento é do "vol2", mas estamos logados como "vol1" (definido na fixture)
    from app.models.appointment_model import Appointment

    appt = Appointment(
        id="a2", patient_id="p1", volunteer_id="vol2", date="2023-10-10", time="11:00"
    )
    session.add(appt)
    session.commit()

    # Tenta iniciar um agendamento que não é dele
    response = client.post("/api/v1/attendance/a2/start")

    # Deve ser proibido (Erro 403 - Forbidden)
    assert response.status_code == 403
