from fastapi import APIRouter, UploadFile, File, Depends
from app.services.s3_service import S3Service
from app.core.security import get_current_user
from app.models.user_model import User

router = APIRouter()

@router.post("/upload", summary="Upload de arquivo para AWS S3", description="Recebe um arquivo e faz o upload para o bucket S3 configurado, retornando a URL pública.")
def upload_file_to_s3(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # O S3Service cuida da segurança da IAM Role
    file_url = S3Service.upload_file(file, folder="clinica-docs")
    return {"url": file_url, "filename": file.filename}
