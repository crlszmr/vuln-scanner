# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, ConfigDict

model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str | None = None

class VulnerabilityCreate(BaseModel):
    cve_id: str
    description: str
    severity: str
    reference_url: str  

class VulnerabilityUpdate(BaseModel):
    description: str | None = None
    severity: str | None = None
    reference_url: str   | None = None

class VulnerabilityResponse(VulnerabilityCreate):
    id: int