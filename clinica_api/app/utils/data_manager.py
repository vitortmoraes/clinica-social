import argparse
import json
import os
import random
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from sqlmodel import Session, select, text

from app.core.database import engine, init_db
from app.core.security import get_password_hash
from app.models.appointment_model import Appointment, AppointmentStatus
from app.models.clinic_settings import ClinicSettings
from app.models.form_template import FormTemplate
from app.models.medical_record_model import MedicalRecord
from app.models.patient_model import Patient
from app.models.payment_table_model import PaymentTable
from app.models.specialty_model import Specialty
from app.models.transaction_model import (PaymentMethod, Transaction,
                                          TransactionType)
# Import Models
from app.models.user_model import Role, User
from app.models.volunteer_model import Volunteer

# Setup Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKUP_DIR = BASE_DIR / "backups"
BACKUP_FILE = BACKUP_DIR / "backup_latest.json"

# --- Fake Data Generators (No external dependencies) ---
FAKE_NAMES = [
    "Machado de Assis",
    "Clarice Lispector",
    "Carlos Drummond",
    "Cecília Meireles",
    "Guimarães Rosa",
    "Jorge Amado",
    "Monteiro Lobato",
    "Vinicius de Moraes",
    "Graciliano Ramos",
    "Lygia Fagundes Telles",
    "Ariano Suassuna",
    "Rachel de Queiroz",
    "Dom Casmurro",
    "Capitu",
    "Brás Cubas",
    "Bentinho",
]

FAKE_CITIES = ["Rio de Janeiro", "São Paulo", "Recife", "Salvador", "Belo Horizonte"]


class FakeProvider:
    @staticmethod
    def name():
        return random.choice(FAKE_NAMES)

    @staticmethod
    def cpf():
        return f"{random.randint(100,999)}.{random.randint(100,999)}.{random.randint(100,999)}-{random.randint(10,99)}"

    @staticmethod
    def phone():
        return f"(11) 9{random.randint(1000,9999)}-{random.randint(1000,9999)}"


# --- Core Functions ---


def ensure_backup_dir():
    if not BACKUP_DIR.exists():
        BACKUP_DIR.mkdir(parents=True)


def serialize_model(instance: Any) -> Dict[str, Any]:
    """Convert SQLModel instance to dict, handling dates."""
    data = instance.model_dump()
    # Convert datetime objects to ISO strings
    for key, value in data.items():
        if isinstance(value, datetime):
            data[key] = value.isoformat()
    return data


def backup_data():
    """Backup all tables to JSON."""
    ensure_backup_dir()
    print(f"[Backup] Starting Backup to {BACKUP_FILE}...")

    data_dump = {}

    with Session(engine) as session:
        # List of models to backup
        models = [
            User,
            Patient,
            Volunteer,
            Specialty,
            Appointment,
            MedicalRecord,
            Transaction,
            ClinicSettings,
            PaymentTable,
            FormTemplate,
        ]

        for model in models:
            table_name = model.__tablename__
            instances = session.exec(select(model)).all()
            data_dump[table_name] = [serialize_model(i) for i in instances]
            print(f"   - Backed up {len(instances)} rows from {table_name}")

    with open(BACKUP_FILE, "w", encoding="utf-8") as f:
        json.dump(data_dump, f, indent=4, ensure_ascii=False)

    print("[Backup] Backup completed successfully!")


def date_hook(json_dict):
    for key, value in json_dict.items():
        try:
            if isinstance(value, str):
                # Simple check if looks like ISO date
                if "T" in value and value[4] == "-" and value[7] == "-":
                    json_dict[key] = datetime.fromisoformat(value)
        except:
            pass
    return json_dict


def wipe_database(session: Session):
    """Clear all data from tables."""
    print("[Wipe] Wiping Database...")
    # Order matters for foreign keys!
    tables = [
        "medical_records",
        "transactions",
        "appointments",
        "volunteers",
        "patients",
        "payment_tables",
        "form_templates",
        "specialties",
        "users",
        "clinic_settings",
    ]

    for table in tables:
        try:
            session.exec(text(f"TRUNCATE TABLE {table} CASCADE;"))
            session.commit()
        except Exception:
            # Fallback for SQLite or if Truncate fails
            session.exec(text(f"DELETE FROM {table};"))
            session.commit()
    print("[Wipe] Database Cleaned.")


def restore_data():
    """Restore data from JSON backup."""
    if not BACKUP_FILE.exists():
        print("[Restore] No backup found to restore!")
        return

    print(f"[Restore] Restoring from {BACKUP_FILE}...")

    with open(BACKUP_FILE, "r", encoding="utf-8") as f:
        data_dump = json.load(
            f
        )  # We handle date conversion manually or let SQLModel try

    with Session(engine) as session:
        wipe_database(session)  # Safety wipe before restore

        # Helper to insert
        def insert_rows(model, rows):
            if not rows:
                return
            for row in rows:
                # Convert date strings back to objects if needed (SQLModel usually handles ISO strings automatically if field is datetime, but let's be safe)
                # Actually SQLModel/Pydantic parses ISO strings automatically.
                instance = model(**row)
                session.add(instance)
            session.commit()
            print(f"   - Restored {len(rows)} rows to {model.__tablename__}")

        # Order matters!
        if "users" in data_dump:
            insert_rows(User, data_dump["users"])
        if "specialties" in data_dump:
            insert_rows(Specialty, data_dump["specialties"])
        if "clinic_settings" in data_dump:
            insert_rows(ClinicSettings, data_dump["clinic_settings"])
        if "payment_tables" in data_dump:
            insert_rows(PaymentTable, data_dump["payment_tables"])
        if "form_templates" in data_dump:
            insert_rows(FormTemplate, data_dump["form_templates"])
        if "patients" in data_dump:
            insert_rows(Patient, data_dump["patients"])
        if "volunteers" in data_dump:
            insert_rows(Volunteer, data_dump["volunteers"])
        if "appointments" in data_dump:
            insert_rows(Appointment, data_dump["appointments"])
        if "medical_records" in data_dump:
            insert_rows(MedicalRecord, data_dump["medical_records"])
        if "transactions" in data_dump:
            insert_rows(Transaction, data_dump["transactions"])

    print("[Restore] Restore completed successfully!")


def seed_fake_data():
    """Populate DB with Demo Data."""
    print("[Seed] Seeding Fake Data for Video...")

    with Session(engine) as session:
        wipe_database(session)

        # 1. Admin User
        admin = User(
            name="Administrador Demo",
            email="admin@clinica.com",
            username="admin@clinica.com",
            password="$2b$12$2klJHnq81Xp16ianxreDv.GKeTU7amXb4a/lYqwqHnnCILfENJw1C",
            role=Role.ADMIN,
        )
        session.add(admin)

        # 2. Specialties
        specs = ["Cardiologia", "Psicologia", "Nutrição", "Clinica Geral", "Pediatria"]
        specialties = []
        for s_name in specs:
            s = Specialty(name=s_name)
            session.add(s)
            specialties.append(s)
        session.commit()

        # Refresh specialties to get IDs
        for s in specialties:
            session.refresh(s)

        # 3. Volunteers
        volunteers = []
        for i in range(5):
            v = Volunteer(
                name=f"Dr(a). {FakeProvider.name().split()[0]}",
                email=f"medico{i}@clinica.com",
                # Hash generated in this environment for '123456'
                password="$2b$12$2klJHnq81Xp16ianxreDv.GKeTU7amXb4a/lYqwqHnnCILfENJw1C",
                specialty="Clinico Geral",
                birth_date="1980-01-01",
                phone="(11) 99999-9999",
                license_number="CRM/SP 123456",
                active=True,
            )
            session.add(v)
            volunteers.append(v)
        session.commit()
        for v in volunteers:
            session.refresh(v)

        # 4. Patients
        patients = []
        for _ in range(15):
            p = Patient(
                name=FakeProvider.name(),
                cpf=FakeProvider.cpf(),
                phone=FakeProvider.phone(),
                whatsapp=FakeProvider.phone(),
                birth_date="1990-01-01",
                address={"city": random.choice(FAKE_CITIES), "street": "Rua Demo, 123"},
                personal_income=2500.00,
                family_income=5000.00,
            )
            session.add(p)
            patients.append(p)
        session.commit()
        for p in patients:
            session.refresh(p)

        # 5. Appointments & Financial
        for _ in range(20):
            pat = random.choice(patients)
            vol = random.choice(volunteers)
            status = random.choice(
                [
                    AppointmentStatus.SCHEDULED,
                    AppointmentStatus.FINISHED,
                    AppointmentStatus.CONFIRMED,
                ]
            )

            now = datetime.now()
            app = Appointment(
                patient_id=pat.id,
                volunteer_id=vol.id,
                date=now.strftime("%Y-%m-%d"),
                time=now.strftime("%H:%M"),
                status=status,
                notes="Consulta Demo Video",
                price=100.00 if status == AppointmentStatus.FINISHED else 0.0,
            )
            session.add(app)
            if status == AppointmentStatus.FINISHED:
                # Add Transaction
                trans = Transaction(
                    description=f"Consulta - {pat.name}",
                    amount=100.00,
                    type=TransactionType.INCOME,
                    date=datetime.now(),
                    category="Consultas",
                    payment_method=PaymentMethod.PIX,
                    patient_id=pat.id,
                    appointment_id=app.id,
                    is_paid=True,
                )
                session.add(trans)

        session.commit()
    print("[Seed] Seed completed! Database is ready for video.")


def clean_database():
    """Wipe DB and create only Admin."""
    print("[Clean] Resetting Database to Factory Defaults...")
    with Session(engine) as session:
        wipe_database(session)

        # Re-create Admin
        admin = User(
            name="Administrador",
            email="admin@clinica.com",
            username="admin@clinica.com",
            password="$2b$12$2klJHnq81Xp16ianxreDv.GKeTU7amXb4a/lYqwqHnnCILfENJw1C",  # 123456
            role=Role.ADMIN,
        )
        session.add(admin)
        session.commit()
    print("[Clean] Database reset. Login: admin@clinica.com / 123456")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LGPD Data Manager")
    parser.add_argument(
        "action",
        choices=["backup", "seed", "restore", "clean"],
        help="Action to perform",
    )

    args = parser.parse_args()

    if args.action == "backup":
        backup_data()
    elif args.action == "seed":
        backup_data()  # Auto backup before seed for safety
        seed_fake_data()
    elif args.action == "restore":
        restore_data()
    elif args.action == "clean":
        clean_database()
