import os
import uuid
import boto3
from fastapi import UploadFile, HTTPException
from botocore.exceptions import NoCredentialsError, PartialCredentialsError

# Pegar de variáveis de ambiente
AWS_REGION = os.getenv("AWS_REGION", "sa-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "clinica-cuidar-storage-vitor")

# Tentar inicializar o cliente Boto3
# Na EC2, se houver IAM Role assinada, o boto3 descobre as credenciais sozinho.
try:
    s3_client = boto3.client('s3', region_name=AWS_REGION)
except Exception as e:
    print(f"Warning: Could not initialize boto3 client: {e}")
    s3_client = None

class S3Service:
    @staticmethod
    def upload_file(file: UploadFile, folder: str = "uploads") -> str:
        if not s3_client:
            raise HTTPException(status_code=500, detail="S3 client not initialized. Check AWS credentials or IAM Role.")

        try:
            # Gerar nome único para o arquivo
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
            unique_name = f"{uuid.uuid4()}.{file_extension}"
            s3_key = f"{folder}/{unique_name}"

            # Fazer upload para o S3
            s3_client.upload_fileobj(
                file.file,
                S3_BUCKET_NAME,
                s3_key,
                ExtraArgs={"ContentType": file.content_type}
            )

            # Retornar a URL pública (ajustar se o bucket for privado)
            file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
            return file_url

        except NoCredentialsError:
            raise HTTPException(status_code=403, detail="AWS credentials not found.")
        except PartialCredentialsError:
            raise HTTPException(status_code=403, detail="Incomplete AWS credentials found.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {str(e)}")
