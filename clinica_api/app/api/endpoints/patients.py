import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import get_current_user
from app.core.security_fields import data_protection
from app.models.patient_model import Patient
from app.models.user_model import User
from app.schemas.patient import Patient as PatientSchema
from app.schemas.patient import PatientBase
from app.services.audit_service import create_audit_log

router = APIRouter()


@router.get(
    "",
    response_model=List[PatientSchema],
    summary="Listar todos os pacientes",
    description="Retorna uma lista de pacientes ativos. **Dados sensíveis (CPF) são descriptografados automaticamente** para visualização.",
)
def read_patients(session: Session = Depends(get_session)):
    # Soft Delete Filter
    patients = session.exec(select(Patient).where(Patient.active == True)).all()
    # Decrypt sensitive data for display
    print(f"DEBUG: Reading {len(patients)} patients...", flush=True)
    for p in patients:
        print(
            f"DEBUG: Patient {p.name} CPF: {p.cpf[:15] if p.cpf else 'None'}...",
            flush=True,
        )
        if p.cpf:
            p.cpf = data_protection.decrypt(p.cpf)
    return patients


@router.post(
    "",
    response_model=PatientSchema,
    summary="Cadastrar novo paciente",
    description="Cria um novo registro de paciente. **O CPF é criptografado automaticamente** antes de ser salvo no banco de dados.",
)
def create_patient(
    patient_in: PatientBase,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Convert Pydantic schema to SQLModel
    # Must dump to dict first so nested models (like Address) are converted to dicts/JSON
    patient_data = patient_in.model_dump()

    # Encrypt Sensitive Data
    if patient_data.get("cpf"):
        patient_data["cpf"] = data_protection.encrypt(patient_data["cpf"])

    db_patient = Patient.model_validate(patient_data)
    db_patient.id = str(uuid.uuid4())  # Generate ID explicitly
    db_patient.active = True  # Ensure new patients are active

    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)
    session.refresh(db_patient)

    create_audit_log(
        session,
        current_user,
        "CREATE",
        "Patient",
        db_patient.id,
        {"name": db_patient.name},
    )
    session.commit()  # Commit log

    # FIX: Decrypt CPF before returning to frontend so it doesn't show "Protegido"
    if db_patient.cpf:
        db_patient.cpf = data_protection.decrypt(db_patient.cpf)

    return db_patient


@router.get(
    "/{patient_id}",
    response_model=PatientSchema,
    summary="Obter detalhes de um paciente",
    description="Busca um paciente pelo ID. Retorna 404 se não encontrado ou inativo.",
)
def read_patient(patient_id: str, session: Session = Depends(get_session)):
    patient = session.get(Patient, patient_id)
    if not patient or not patient.active:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Decrypt
    if patient.cpf:
        patient.cpf = data_protection.decrypt(patient.cpf)

    return patient


@router.put(
    "/{patient_id}",
    response_model=PatientSchema,
    summary="Atualizar dados do paciente",
    description="Atualiza campos do paciente. Se o CPF for alterado, ele será criptografado novamente.",
)
def update_patient(
    patient_id: str,
    patient_in: PatientBase,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient or not db_patient.active:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_data = patient_in.model_dump(exclude_unset=True)

    # Encrypt if updating CPF
    if "cpf" in patient_data:
        patient_data["cpf"] = data_protection.encrypt(patient_data["cpf"])

    for key, value in patient_data.items():
        setattr(db_patient, key, value)

    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)

    create_audit_log(
        session,
        current_user,
        "UPDATE",
        "Patient",
        db_patient.id,
        {"name": db_patient.name, "changes": list(patient_data.keys())},
    )
    session.commit()

    # FIX: Decrypt CPF before returning to frontend
    if db_patient.cpf:
        db_patient.cpf = data_protection.decrypt(db_patient.cpf)

    return db_patient


@router.delete(
    "/{patient_id}",
    status_code=204,
    summary="Arquivar paciente (Soft Delete)",
    description="Marca o paciente como inativo (`active=False`). Não remove do banco para manter integridade do histórico.",
)
def delete_patient(
    patient_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient or not db_patient.active:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Capture data before modification/commit to avoid expiry issues
    patient_name = db_patient.name
    print(f"DEBUG: Soft deleting patient {patient_name} ({patient_id})")

    # Soft Delete Implementation
    db_patient.active = False
    session.add(db_patient)
    session.commit()

    try:
        create_audit_log(
            session,
            current_user,
            "DELETE (SOFT)",
            "Patient",
            patient_id,
            {"name": patient_name},
        )
        session.commit()
        print(f"DEBUG: Audit log created for deletion of {patient_name}")
    except Exception as e:
        print(f"ERROR: Failed to create audit log for deletion: {e}")

    return


@router.post(
    "/{patient_id}/anonymize",
    response_model=PatientSchema,
    summary="Anonimizar paciente (Direito ao Esquecimento)",
    description="**Ação Irreversível.** Substitui dados pessoais por valores anonimizados, mantendo apenas o ID e histórico clínico estatístico.",
)
def anonymize_patient(
    patient_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Anonymization Logic
    # We must keep the record for history but remove PII
    original_name = db_patient.name

    import uuid

    random_id = str(uuid.uuid4())[:8]

    db_patient.name = f"ANONIMIZADO-{random_id}"
    db_patient.cpf = f"ANON-{str(uuid.uuid4())}"  # Unique constraint
    db_patient.email = None
    db_patient.whatsapp = "00000000000"
    # FIX: Populate address with dummy data to satisfy Pydantic Schema validation
    db_patient.address = {
        "cep": "00000000",
        "street": "ANONIMIZADO",
        "number": "S/N",
        "neighborhood": "ANONIMIZADO",
        "city": "ANONIMIZADO",
        "state": "XX",
    }
    db_patient.guardian_name = None
    db_patient.guardian_cpf = None
    db_patient.guardian_phone = None
    db_patient.photo = None
    db_patient.files = []

    # Mark as inactive (Soft Delete)
    db_patient.active = False

    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)

    try:
        create_audit_log(
            session,
            current_user,
            "ANONYMIZE",
            "Patient",
            patient_id,
            {"original_name": original_name},
        )
        session.commit()
    except Exception as e:
        print(f"ERROR: Failed to create audit log for anonymization: {e}")

    return db_patient
