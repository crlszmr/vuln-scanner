# backend/app/crud/cve_descriptions.py
from sqlalchemy.orm import Session
from app.models.cve_description import CveDescription
from app.schemas.cve_description import CveDescriptionCreate

def create_multi(db: Session, descriptions: list[CveDescriptionCreate]) -> None:
    for desc in descriptions:
        exists = db.query(CveDescription).filter_by(
            cve_id=desc.cve_id,
            lang=desc.lang
        ).first()

        if not exists:
            db_obj = CveDescription(**desc.model_dump())
            db.add(db_obj)

    db.commit()

def create_one(db: Session, description: CveDescriptionCreate) -> CveDescription:
    db_obj = CveDescription(**description.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_by_cve_id(db: Session, cve_id: int):
    return db.query(CveDescription).filter(CveDescription.cve_id == cve_id).all()
