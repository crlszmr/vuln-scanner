# backend/app/schemas/cpe_reference.py
from pydantic import BaseModel
from typing import Optional

class CPEReferenceBase(BaseModel):
    ref: str
    type: Optional[str] = None

class CPEReferenceCreate(BaseModel):
    platform_id: int  # ✅ necesario para que funcione tu inserción
    ref: str
    type: str | None = None

class CPEReference(CPEReferenceBase):
    id: int

    class Config:
        from_attributes = True
