# backend/app/schemas/weakness.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class WeaknessBase(BaseModel):
    name: str
    abstraction: Optional[str] = None
    structure: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    extended_description: Optional[str] = None

    modes_of_introduction: Optional[List[Dict[str, Any]]] = []
    applicable_platforms: Optional[List[Dict[str, Any]]] = []
    alternate_terms: Optional[List[Dict[str, Any]]] = []
    potential_mitigations: Optional[List[Dict[str, Any]]] = []
    consequences: Optional[List[Dict[str, Any]]] = []
    demonstrative_examples: Optional[List[Dict[str, Any]]] = []
    observed_examples: Optional[List[Dict[str, Any]]] = []
    taxonomy_mappings: Optional[List[Dict[str, Any]]] = []
    relationships: Optional[List[Dict[str, Any]]] = []
    background_details: Optional[str] = None

class WeaknessCreate(WeaknessBase):
    id: int

class Weakness(WeaknessBase):
    id: int

    class Config:
        from_attributes = True
