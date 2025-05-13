from sqlalchemy.orm import Session
from app.models.cve_reference import CveReference
from app.schemas.cve_reference import ReferenceCreate

def create_multi(db: Session, references: list[ReferenceCreate]) -> None:
    for ref in references:
        exists = db.query(CveReference).filter_by(
            cve_id=ref.cve_id,
            url=ref.url
        ).first()

        if not exists:
            db_obj = CveReference(**ref.model_dump())
            db.add(db_obj)

    db.commit()

def get_by_cve_id(db: Session, cve_id: int):
    return db.query(CveReference).filter(CveReference.cve_id == cve_id).all()
