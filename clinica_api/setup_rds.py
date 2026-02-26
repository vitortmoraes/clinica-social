
import logging
from sqlmodel import SQLModel, create_engine, Session, select
from app.models.user_model import User, Role
from app.models.patient_model import Patient
from app.models.volunteer_model import Volunteer
from app.models.appointment_model import Appointment
from app.models.medical_record_model import MedicalRecord
from app.models.audit_model import AuditLog
from app.models.transaction_model import Transaction
from app.models.clinic_settings import ClinicSettings
from app.models.specialty_model import Specialty
from app.models.payment_table_model import PaymentTable
from app.models.form_template import FormTemplate

# Configuração de Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RDS-Setup")

# 1. Configurações de Conexão (Dados fornecidos pelo Usuário)
DB_ENDPOINT = "db-clinica-cuidar.cz8240csefyf.sa-east-1.rds.amazonaws.com"
DB_USER = "postgres"
DB_PASS = "infO04fa"
DB_NAME = "postgres"  # Geralmente o nome padrão na criação do RDS

# String de Conexão Direta (PostgreSQL Nativo)
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_ENDPOINT}:5432/{DB_NAME}"

# Criar Engine do Banco de Dados
engine = create_engine(DATABASE_URL, echo=True)

def setup_database():
    """
    Cria todas as tabelas e o usuário administrador inicial no AWS RDS.
    """
    try:
        logger.info("📡 Conectando ao AWS RDS e criando tabelas...")
        
        # Cria todas as tabelas baseadas nos modelos do SQLModel
        SQLModel.metadata.create_all(engine)
        logger.info("✅ Tabelas criadas com sucesso no RDS!")

        # Criar Usuário Administrador Inicial (Se não existir)
        with Session(engine) as session:
            admin_user = session.exec(select(User).where(User.username == "admin")).first()
            
            if not admin_user:
                logger.info("👤 Criando usuário administrador inicial...")
                new_admin = User(
                    name="Administrador Geral",
                    username="admin",
                    password="admin",  # Recomendado alterar no primeiro acesso
                    role=Role.ADMIN
                )
                session.add(new_admin)
                
                # Criar configurações básicas da clínica
                settings = ClinicSettings(
                    clinic_name="Clínica Social Cuidar",
                    primary_color="#059669"
                )
                session.add(settings)
                
                session.commit()
                logger.info("✅ Usuário 'admin' e configurações iniciais criados!")
            else:
                logger.info("ℹ️ Usuário 'admin' já existe. Pulando criação.")

        logger.info("🚀 Banco de Dados AWS RDS configurado com sucesso e pronto para uso!")

    except Exception as e:
        logger.error(f"❌ Erro ao configurar o banco: {str(e)}")
        logger.info("\n💡 Dica: Verifique se o 'Security Group' do seu RDS está aberto para o IP deste computador (Porta 5432).")

if __name__ == "__main__":
    setup_database()
