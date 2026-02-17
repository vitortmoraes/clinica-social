from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.middleware import AuditMiddleware
from app.core.rate_limiter import limiter
from app.core.rate_limiter import \
    rate_limit_exceeded_handler as custom_rate_handler


def create_app() -> FastAPI:

    tags_metadata = [
        {
            "name": "Patients",
            "description": "Gestão completa de **Pacientes**, incluindo dados sensíveis (LGPD) e prontuários.",
        },
        {
            "name": "Auth",
            "description": "Autenticação e Autorização (Login, Tokens).",
        },
        {
            "name": "Audit",
            "description": "Logs de Auditoria para rastreabilidade de ações.",
        },
    ]

    app = FastAPI(
        title="Clínica Social Cuidar - API System",
        description="""
**API Oficial de Gestão da Clínica Social Cuidar.**

## Funcionalidades Principais:
*   **Gestão de Pacientes**: Cadastro completo com criptografia de dados sensíveis (LGPD).
*   **Prontuário Eletrônico**: Registro histórico de atendimentos.
*   **Controle Financeiro**: Receitas e Despesas.
*   **Auditoria**: Rastreabilidade total de ações.

## Segurança e Governança:
*   Todos os endpoints são protegidos (JWT).
*   Rate Limiting ativo para prevenção de ataques.
*   Dados sensíveis (CPF) são criptografados no banco (Fernet).
        """,
        version=settings.PROJECT_VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        contact={
            "name": "Suporte Técnico - Vitor Moraes",
            "email": "suporte@clinicasocial.com.br",
        },
        license_info={
            "name": "Private License",
        },
        openapi_tags=tags_metadata,
    )

    # Rate Limiter
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, custom_rate_handler)
    app.add_middleware(SlowAPIMiddleware)

    # Security Headers
    from app.core.security_headers import SecurityHeadersMiddleware

    app.add_middleware(SecurityHeadersMiddleware)

    # Telemetry (Sentry)
    from app.core.telemetry import setup_telemetry

    setup_telemetry()

    app.add_middleware(AuditMiddleware)

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Basic Health Check (with DB)
    from sqlmodel import text

    from app.core.database import engine

    @app.get("/health")
    def health_check():
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return {
                "status": "ok",
                "database": "connected",
                "version": settings.PROJECT_VERSION,
            }
        except Exception as e:
            return {"status": "error", "database": "disconnected", "details": str(e)}

    # Include API router
    from app.api.api import api_router

    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Initialize Backup Scheduler
    from app.services.backup_service import BackupService

    @app.on_event("startup")
    def startup_event():
        BackupService.start_scheduler()

    return app


app = create_app()

# Forced reload for settings update
