# backend/app/crud/cpe_references.py
from sqlalchemy.orm import Session
from app.models.cpe_reference import CPEReference
from app.schemas.cpe_reference import CPEReferenceCreate

def create_multi(db: Session, references: list[CPEReferenceCreate]) -> None:
    objs = [CPEReference(**ref.dict()) for ref in references]
    db.add_all(objs)
    db.commit()  # o db.flush() si el commit se hace fuera

