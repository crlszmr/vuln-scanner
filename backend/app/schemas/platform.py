# backend/app/schemas/platform.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PlatformCreate(BaseModel):
    cpe_uri: str
    deprecated: bool = False
    imported_at: Optional[datetime] = None

class PlatformResponse(PlatformCreate):
    id: int
