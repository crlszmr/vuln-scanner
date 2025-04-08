# backend/app/schemas/cpe_deprecated_by.py
from pydantic import BaseModel

class CpeDeprecatedByCreate(BaseModel):
    platform_id: int
    deprecated_by_cpe: str

class CpeDeprecatedBy(CpeDeprecatedByCreate):
    id: int

    class Config:
        from_attributes = True  # reemplaza a orm_mode en Pydantic v2
