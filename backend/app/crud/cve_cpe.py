# backend/app/crud/cve_cpe.py
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.models.cve_cpe import CveCpe
from app.schemas.cve_cpe import CveCpeCreate

def create_multi(db: Session, relations: list[CveCpeCreate]) -> None:
    if not relations:
        return

    print(f"📝 Relaciones a insertar en cve_cpe: {len(relations)}")
    for r in relations:
        print(f"   -> {r.cve_name} -> {r.cpe_uri}")
        
    stmt = insert(CveCpe).values([r.dict() for r in relations])
    stmt = stmt.on_conflict_do_nothing(index_elements=["cve_name", "cpe_uri"])
    db.execute(stmt)
    db.commit()

