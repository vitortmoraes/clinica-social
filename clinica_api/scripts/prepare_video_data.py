import os
import sys

from sqlmodel import Session, delete, select

# Add project root to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine
from app.models.appointment_model import Appointment
from app.models.patient_model import Patient


def reset_patients_for_video():
    target_name = "Victor Teixeira Pacientemente"

    with Session(engine) as session:
        # Find the target patient
        statement = select(Patient).where(Patient.name == target_name)
        target_patient = session.exec(statement).first()

        if not target_patient:
            print(f"ERRO: Paciente '{target_name}' não encontrado.")
            return

        print(
            f"Paciente alvo encontrado: {target_patient.name} (ID: {target_patient.id})"
        )

        # 1. Find all other patients IDs
        statement_all = select(Patient.id).where(Patient.id != target_patient.id)
        other_patient_ids = session.exec(statement_all).all()

        if not other_patient_ids:
            print("Nenhum outro paciente encontrado para excluir.")
            return

        print(f"Encontrados {len(other_patient_ids)} pacientes para exclusão.")

        # 2. Delete Appointments for these patients
        statement_appointments = delete(Appointment).where(
            Appointment.patient_id.in_(other_patient_ids)
        )
        result_appointments = session.exec(statement_appointments)
        print(f"Apagados {result_appointments.rowcount} agendamentos associados.")

        # 3. Delete Patients (Hard Delete)
        statement_delete_patients = delete(Patient).where(
            Patient.id.in_(other_patient_ids)
        )
        result_patients = session.exec(statement_delete_patients)
        print(
            f"Apagados {result_patients.rowcount} pacientes do banco de dados (Hard Delete)."
        )

        session.commit()
        print(f"\nSucesso! Apenas '{target_name}' permanece no banco.")


if __name__ == "__main__":
    reset_patients_for_video()
