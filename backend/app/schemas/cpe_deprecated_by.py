# backend/app/schemas/cpe_deprecated_by.py
from pydantic import BaseModel
from typing import Optional

class CpeDeprecatedByCreate(BaseModel):
    platform_id: int
    cpe_uri: str
    cpe_name_id: Optional[str] = None

class CpeDeprecatedBy(CpeDeprecatedByCreate):
    id: int

    class Config:
        from_attributes = True  # reemplaza a orm_mode en Pydantic v2
