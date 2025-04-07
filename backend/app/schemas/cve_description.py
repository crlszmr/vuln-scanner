# backend/app/schemas/platform.py
from pydantic import BaseModel
from typing import Optional

class CveDescriptionBase(BaseModel):
    lang: str
    value: str

class CveDescriptionCreate(CveDescriptionBase):
    cve_id: int

class CveDescriptionResponse(CveDescriptionBase):
    id: int
    cve_id: int

    class Config:
        orm_mode = True
