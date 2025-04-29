# backend/app/crud/cve_cwe.py
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.models.cve_cwe import CveCwe
from app.schemas.cve_cwe import CveCweCreate

def create_multi(db: Session, relations: list[CveCweCreate]) -> None:
    if not relations:
        return

    stmt = insert(CveCwe).values([r.dict() for r in relations])
    stmt = stmt.on_conflict_do_nothing(index_elements=["cve_name", "cwe_id"])
    db.execute(stmt)
    db.commit()
