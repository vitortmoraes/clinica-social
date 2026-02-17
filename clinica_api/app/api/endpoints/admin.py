import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.core.security import get_current_user
from app.models.user_model import User
from app.services.backup_service import BACKUP_DIR, BackupService

router = APIRouter()


@router.post("/backup")
def trigger_backup(current_user: User = Depends(get_current_user)):
    # Optional: Check if user is admin
    filename = BackupService.perform_backup()
    if not filename:
        raise HTTPException(status_code=500, detail="Backup Failed")
    return {"message": "Backup created successfully", "filename": filename}


@router.get("/backups")
def list_backups(current_user: User = Depends(get_current_user)):
    if not BACKUP_DIR.exists():
        return []

    files = []
    for f in BACKUP_DIR.glob("*.enc"):
        stat = f.stat()
        files.append(
            {"filename": f.name, "size": stat.st_size, "created_at": stat.st_mtime}
        )

    # Sort by creation time desc
    files.sort(key=lambda x: x["created_at"], reverse=True)
    return files


@router.get("/backups/{filename}")
def download_backup(filename: str, current_user: User = Depends(get_current_user)):
    file_path = BACKUP_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Backup not found")

    return FileResponse(
        path=file_path, filename=filename, media_type="application/octet-stream"
    )
