# backend/app/schemas/cve_reference.py
from pydantic import BaseModel
from typing import Optional

class ReferenceBase(BaseModel):
    url: str
    name: Optional[str] = None
    tags: Optional[str] = None

class ReferenceCreate(ReferenceBase):
    cve_id: int

class ReferenceResponse(ReferenceBase):
    id: int
    cve_id: int

    class Config:

        orm_mode = True
