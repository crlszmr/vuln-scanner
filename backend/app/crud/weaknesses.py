# backend/app/crud/weaknesses.py
from sqlalchemy.orm import Session
from app.models.weakness import Weakness
from app.schemas.weakness import WeaknessCreate

def create_or_update_weakness(db: Session, obj_in: WeaknessCreate) -> Weakness:
    db_obj = db.query(Weakness).filter(Weakness.id == obj_in.id).first()
    if db_obj:
        for field, value in obj_in.dict().items():
            setattr(db_obj, field, value)
    else:
        db_obj = Weakness(**obj_in.dict())
        db.add(db_obj)
    return db_obj

def create_multi(db: Session, weaknesses: list[WeaknessCreate]) -> None:
    for weakness in weaknesses:
        create_or_update_weakness(db, weakness)
