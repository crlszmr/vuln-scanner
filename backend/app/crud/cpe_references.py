# backend/app/crud/cpe_references.py
from sqlalchemy.orm import Session
from app.models.cpe_reference import CPEReference
from app.schemas.cpe_reference import CPEReferenceCreate

def create_reference(db: Session, platform_id: int, reference: CPEReferenceCreate) -> CPEReference:
    db_ref = CPEReference(platform_id=platform_id, **reference.dict())
    db.add(db_ref)
    return db_ref

def create_multi(db: Session, platform_id: int, references: list[CPEReferenceCreate]) -> None:
    for ref in references:
        create_reference(db, platform_id, ref)
