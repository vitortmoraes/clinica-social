import sys
import os
import uuid

# Adiciona o diretório atual ao PYTHONPATH para encontrar os módulos app.*
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.core.database import engine
from app.models.user_model import User, Role
from app.core.security import get_password_hash

def run():
    with Session(engine) as session:
        # Verifica se já existe um admin
        admin = session.exec(select(User).where(User.username == "admin")).first()
        if admin:
            print("⚠️ O usuário 'admin' já existe!")
            return
            
        print("Aguarde, criando usuário admin de sistema...")
        new_admin = User(
            id=str(uuid.uuid4()),
            name="Administrador do Sistema",
            username="admin",
            password=get_password_hash("admin"),
            role=Role.ADMIN
        )
        session.add(new_admin)
        session.commit()
        print("✅ Usuário admin criado com SUCESSO! Faça login com: admin / admin")

if __name__ == "__main__":
    run()
