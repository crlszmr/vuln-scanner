# backend/app/schemas/cpe_title.py
from pydantic import BaseModel

class CpeTitleCreate(BaseModel):
    platform_id: int
    lang: str
    value: str