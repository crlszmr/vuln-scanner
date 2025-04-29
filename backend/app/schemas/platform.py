# backend/app/schemas/platform.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PlatformCreate(BaseModel):
    cpe_uri: str
    cpe_name_id: Optional[str] = None
    deprecated: bool = False
    created: Optional[datetime] = None
    last_modified: Optional[datetime] = None
    raw_titles: Optional[list] = []
    raw_deprecated_by: Optional[list] = []
    raw_refs: Optional[list[dict]] = None


class PlatformResponse(PlatformCreate):
    id: int
