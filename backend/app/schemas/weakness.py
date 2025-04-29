# backend/app/schemas/weakness.py
from pydantic import BaseModel
from typing import Optional

class WeaknessBase(BaseModel):
    name: str
    abstraction: Optional[str] = None
    structure: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    extended_description: Optional[str] = None

    modes_of_introduction: Optional[str] = None
    applicable_platforms: Optional[str] = None
    alternate_terms: Optional[str] = None
    potential_mitigations: Optional[str] = None
    consequences: Optional[str] = None
    demonstrative_examples: Optional[str] = None
    observed_examples: Optional[str] = None
    taxonomy_mappings: Optional[str] = None
    relationships: Optional[str] = None
    background_details: Optional[str] = None

class WeaknessCreate(WeaknessBase):
    id: int

class Weakness(WeaknessBase):
    id: int

    class Config:
        from_attributes = True
