# backend/app/schemas/platform.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict

class PlatformCreate(BaseModel):
    cpe_uri: str
    deprecated: bool = False
    deprecation_date: Optional[datetime] = None
    created: Optional[datetime] = None
    last_modified: Optional[datetime] = None
    raw_titles: Optional[list] = []
    raw_deprecated_by: Optional[list] = []

class PlatformResponse(PlatformCreate):
    id: int
