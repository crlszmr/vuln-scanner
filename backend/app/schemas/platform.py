# backend/app/schemas/platform.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PlatformCreate(BaseModel):
    cpe_uri: str
    title: str
    lang: Optional[str] = "en"
    deprecated: Optional[bool] = False
    deprecated_by: Optional[str] = None
    last_modified: Optional[datetime] = None
    created: Optional[datetime] = None

class PlatformResponse(PlatformCreate):
    id: int
