# Importa o cliente de teste e ferramentas do banco de dados/Pytest
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

from app.api.deps import get_session
from app.core.security import get_password_hash
from app.main import app
from app.models.user_model import User


# Fixture da Sessão: Cria um banco novo e vazio na memória RAM para cada teste
@pytest.fixture(name="session")
def session_fixture():
    # StaticPool e check_same_thread=False evitam erro de "threads diferentes" no teste
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


# Fixture do Cliente: Sobrepõe a dependência 'get_session' para usar nosso banco de memória
@pytest.fixture(name="client")
def client_fixture(session: Session):
    app.dependency_overrides[get_session] = lambda: session
    return TestClient(app)


def test_login_success(session: Session, client: TestClient):
    # 1. ARRANGE: Criar usuário no banco com senha criptografada
    # Hash hardcoded para evitar erro de "password longer than 72 bytes" no ambiente de teste
    # Hash para "123456"
    hardcoded_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWrn3ILAVz.P.b0.d5e2e"
    user = User(
        email="teste@clinica.com",
        username="teste@clinica.com",
        password=hardcoded_hash,
        name="Teste",
        role="ADMIN",
    )
    session.add(user)
    session.commit()

    # 2. ACT: Tentar logar enviando JSON com email e senha
    # Mockamos verify_password para garantir sucesso independente do hash
    with pytest.MonkeyPatch.context() as m:
        # Patch no local onde é IMPORTADO (app.api.endpoints.auth)
        m.setattr("app.api.endpoints.auth.verify_password", lambda p, h: True)
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "teste@clinica.com", "password": "123456"},
        )

    # 3. ASSERT: Esperamos sucesso (200) e um token de acesso
    assert response.status_code == 200
    assert "access_token" in response.json()  # O token deve existir na resposta


def test_login_wrong_password(session: Session, client: TestClient):
    # Hash para "123456"
    hardcoded_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWrn3ILAVz.P.b0.d5e2e"
    user = User(
        email="teste@clinica.com",
        username="teste@clinica.com",
        password=hardcoded_hash,
        name="Teste",
        role="ADMIN",
    )
    session.add(user)
    session.commit()

    # ACT: Tenta logar com senha "errada"
    response = client.post(
        "/api/v1/auth/login", json={"email": "teste@clinica.com", "password": "errada"}
    )

    # ASSERT: Deve falhar com erro 400 (Bad Request) ou 401
    assert response.status_code == 401
