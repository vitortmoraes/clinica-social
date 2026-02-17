import os
import subprocess
from datetime import datetime
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from cryptography.fernet import Fernet
from sqlmodel import Session, select

from app.core.database import engine
from app.core.security_fields import STABLE_KEY
from app.models.clinic_settings import ClinicSettings

BACKUP_DIR = Path("backups")
BACKUP_DIR.mkdir(exist_ok=True)

# Use the same key as DataProtectionService for simplicity, or a dedicated one.
# For now, using STABLE_KEY to ensure we can decrypt it later with the same app.
cipher = Fernet(STABLE_KEY)

scheduler = BackgroundScheduler()


class BackupService:
    @staticmethod
    def get_pg_dump_path():
        # Try to find pg_dump in common locations or PATH
        possible_paths = [
            r"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
            r"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
            r"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
            "pg_dump",
        ]
        for path in possible_paths:
            if path == "pg_dump":
                # Check if in PATH
                from shutil import which

                if which("pg_dump"):
                    return "pg_dump"
            elif os.path.exists(path):
                return path
        return None

    @staticmethod
    def perform_backup():
        print("Starting Secure Backup...", flush=True)
        pg_dump_cmd = BackupService.get_pg_dump_path()
        if not pg_dump_cmd:
            print("ERROR: pg_dump not found!", flush=True)
            return None

        # Database URL is in env, but pg_dump needs components.
        # Assuming localhost/postgres/informatica04/clinica_cuidar based on env file viewed earlier
        # In production, parse DATABASE_URL
        os.environ["PGPASSWORD"] = "informatica04"

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"encrypted_backup_{timestamp}.enc"
        filepath = BACKUP_DIR / filename

        try:
            # Run pg_dump and capture output
            # -Fc: Custom format (compressed)
            command = [
                pg_dump_cmd,
                "-h",
                "localhost",
                "-U",
                "postgres",
                "-d",
                "clinica_cuidar",
                "-F",
                "c",
            ]

            process = subprocess.Popen(
                command, stdout=subprocess.PIPE, stderr=subprocess.PIPE
            )
            dump_data, stderr = process.communicate()

            if process.returncode != 0:
                print(f"ERROR: pg_dump failed: {stderr.decode()}", flush=True)
                return None

            # Encrypt
            encrypted_data = cipher.encrypt(dump_data)

            # Save
            with open(filepath, "wb") as f:
                f.write(encrypted_data)

            print(f"SUCCESS: Backup saved to {filepath}", flush=True)

            # Update Last Backup At
            with Session(engine) as session:
                settings = session.exec(select(ClinicSettings)).first()
                if settings:
                    settings.last_backup_at = datetime.now().isoformat()
                    session.add(settings)
                    session.commit()

            return filename

        except Exception as e:
            print(f"ERROR: Backup exception: {e}", flush=True)
            return None

    @staticmethod
    def start_scheduler():
        if not scheduler.running:
            scheduler.start()
            print("Backup Scheduler Started", flush=True)
            BackupService.reschedule_jobs()

    @staticmethod
    def reschedule_jobs():
        scheduler.remove_all_jobs()

        with Session(engine) as session:
            settings = session.exec(select(ClinicSettings)).first()
            if not settings:
                return

            if settings.backup_frequency == "manual":
                print("Backup Schedule: MANUAL (No automatic jobs)", flush=True)
                return

            # Parse time
            try:
                hour, minute = settings.backup_time.split(":")
            except:
                hour, minute = "03", "00"

            trigger = None
            if settings.backup_frequency == "daily":
                trigger = CronTrigger(hour=hour, minute=minute)
                print(f"Backup Scheduled: DAILY at {hour}:{minute}", flush=True)
            elif settings.backup_frequency == "weekly":
                trigger = CronTrigger(day_of_week="sun", hour=hour, minute=minute)
                print(f"Backup Scheduled: WEEKLY (Sun) at {hour}:{minute}", flush=True)

            if trigger:
                scheduler.add_job(BackupService.perform_backup, trigger)
