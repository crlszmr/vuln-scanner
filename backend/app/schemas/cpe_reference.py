# backend/app/schemas/cpe_reference.py
from pydantic import BaseModel
from typing import Optional

class CPEReferenceBase(BaseModel):
    ref: str
    type: Optional[str] = None

class CPEReferenceCreate(CPEReferenceBase):
    pass

class CPEReference(CPEReferenceBase):
    id: int

    class Config:
        orm_mode = True
