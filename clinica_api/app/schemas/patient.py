from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class Address(BaseModel):
    cep: str = Field(..., description="Código Postal (CEP)", example="12345-678")
    street: str = Field(..., description="Nome da Rua", example="Rua das Flores")
    number: str = Field(..., description="Número da residência", example="123")
    complement: Optional[str] = Field(
        None, description="Complemento (Apto, Bloco, etc)", example="Apto 101"
    )
    neighborhood: str = Field(..., description="Bairro", example="Centro")
    city: str = Field(..., description="Cidade", example="São Paulo")
    state: str = Field(..., description="Estado (UF)", example="SP")


class PatientBase(BaseModel):
    name: str = Field(
        ..., description="Nome completo do paciente", example="João da Silva"
    )
    cpf: str = Field(
        ...,
        description="CPF do paciente (será criptografado)",
        example="123.456.789-00",
    )
    rg: Optional[str] = Field(
        None, description="RG do paciente", example="12.345.678-9"
    )
    birth_date: str = Field(
        ..., description="Data de nascimento (YYYY-MM-DD)", example="1980-01-01"
    )
    whatsapp: str = Field(
        ..., description="Número de WhatsApp com DDD", example="11999999999"
    )
    email: Optional[str] = Field(
        None, description="Email de contato", example="joao@email.com"
    )

    address: Address = Field(..., description="Endereço completo")

    personal_income: float = Field(
        ..., description="Renda pessoal mensal", example=1500.00
    )
    family_income: float = Field(
        ..., description="Renda familiar mensal", example=3000.00
    )
    observations: Optional[str] = Field(
        None, description="Observações gerais", example="Paciente diabético"
    )

    files: List[Dict[str, str]] = Field(
        default=[], description="Lista de arquivos anexados (URLs)"
    )
    photo: Optional[str] = Field(None, description="URL da foto do perfil")

    payment_table_id: Optional[str] = Field(
        None, description="ID da tabela de preços associada"
    )

    # Campos de Responsável (Menores de idade)
    guardian_name: Optional[str] = Field(
        None, description="Nome do responsável", example="Maria da Silva"
    )
    guardian_cpf: Optional[str] = Field(
        None, description="CPF do responsável", example="987.654.321-00"
    )
    guardian_phone: Optional[str] = Field(
        None, description="Telefone do responsável", example="11988888888"
    )

    # LGPD
    lgpd_consent: bool = Field(False, description="Consentimento LGPD assinado?")
    lgpd_consent_date: Optional[str] = Field(
        None, description="Data do consentimento (ISO)"
    )


class Patient(PatientBase):
    id: str = Field(..., description="ID único do sistema (UUID)")

    model_config = ConfigDict(from_attributes=True)
