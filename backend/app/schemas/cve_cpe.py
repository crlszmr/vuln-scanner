# backend/app/schemas/cve_cpe.py

from pydantic import BaseModel

class CveCpeCreate(BaseModel):
    cve_name: str
    cpe_uri: str
