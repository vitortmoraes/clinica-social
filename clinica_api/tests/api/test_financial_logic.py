# Importamos as ferramentas que vamos usar.
# Pense nisso como separar os ingredientes na bancada.
from datetime import datetime

import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.api.endpoints.financial import recalculate_appointment_financials
from app.models.appointment_model import Appointment
from app.models.transaction_model import (PaymentMethod, Transaction,
                                          TransactionType)


# Fixture da Sessão: Cria um banco novo e vazio na memória RAM para cada teste
@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session  # yield entrega a sessão para a função de teste abaixo


# Agora o teste de verdade. O nome da função deve começar com "test_".
# O argumento "session" vem da fixture acima (a mesa limpa pronta para uso).
def test_recalc_partial_payment(session: Session):
    # 1. Preparação (Arrange) - Colocamos os ingredientes na panela.
    # Criamos um agendamento fictício de R$ 100,00
    appt = Appointment(
        id="app1",
        patient_id="p1",
        volunteer_id="v1",
        date="2023-01-01",
        time="10:00",
        price=100.0,
    )
    session.add(appt)  # Colocamos no banco (na memória)

    # Criamos uma transação fictícia (um PIX de R$ 50,00)
    tx = Transaction(
        amount=50.0,
        type=TransactionType.INCOME,
        payment_method=PaymentMethod.PIX,
        date=datetime.strptime(
            "2023-01-01", "%Y-%m-%d"
        ),  # Corrigido data -> date e convertido para datetime
        description="Pagamento Parcial",
        appointment_id="app1",  # Ligamos ao agendamento acima
    )
    session.add(tx)
    session.commit()  # Salvamos tudo. O "cenário" está pronto.

    # 2. Ação (ACT) - Ligamos o fogo.
    # Chamamos a função que queremos testar. Ela deve olhar as transações e atualizar o agendamento.
    recalculate_appointment_financials(session, "app1")

    # Recarregamos "appt" do banco para ver se os dados mudaram mesmo
    session.refresh(appt)

    # 3. Verificação (Assert) - Provamos o sabor.
    # O computador verifica: "O valor pago é 50?"
    assert appt.amount_paid == 50.0

    # "O Status mudou para PARCIAL?"
    assert appt.payment_status == "PARTIAL"
