from pydantic import BaseModel, ConfigDict


class SpecialtyBase(BaseModel):
    name: str
    anamnesis_type: str = "general"


class SpecialtyCreate(SpecialtyBase):
    pass


class Specialty(SpecialtyBase):
    id: str

    model_config = ConfigDict(from_attributes=True)
