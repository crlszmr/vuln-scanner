from pydantic import BaseModel

class CveCweCreate(BaseModel):
    cve_name: str
    cwe_id: str
