from sqlmodel import Session, select

from app.core.database import engine
from app.core.security_fields import data_protection
from app.models.patient_model import Patient


def migrate_cpfs():
    with Session(engine) as session:
        print("--- Encrypting Existing CPFs ---")
        patients = session.exec(select(Patient)).all()
        count = 0

        for p in patients:
            if p.cpf and not p.cpf.startswith(
                "gAAAA"
            ):  # Fernet strings start with gAAAA
                try:
                    # Encrypt
                    encrypted = data_protection.encrypt(p.cpf)
                    p.cpf = encrypted
                    session.add(p)
                    count += 1
                    print(f"Encrypted CPF for: {p.name}")
                except Exception as e:
                    print(f"Error encrypting {p.name}: {e}")

        session.commit()
        print(f"--- Migration Complete. Encrypted {count} records. ---")


if __name__ == "__main__":
    migrate_cpfs()
