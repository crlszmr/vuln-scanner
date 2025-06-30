from sqlalchemy.orm import Session
from app.models.weakness import Weakness
from app.schemas.weakness import WeaknessCreate
import json

# Lista de campos que necesitan json.dumps antes de guardar
JSON_FIELDS = [
    "modes_of_introduction",
    "applicable_platforms",
    "alternate_terms",
    "potential_mitigations",
    "consequences",
    "demonstrative_examples",
    "observed_examples",
    "taxonomy_mappings",
    "relationships"
]

def create_or_update_weakness(db: Session, obj_in: WeaknessCreate) -> Weakness:
    db_obj = db.query(Weakness).filter(Weakness.id == obj_in.id).first()

    # Preparamos los datos, serializando los campos complejos
    data = obj_in.dict(exclude_none=True)
    for field in JSON_FIELDS:
        if field in data and isinstance(data[field], list):
            data[field] = json.dumps(data[field], ensure_ascii=False)

    if db_obj:
        for field, value in data.items():
            setattr(db_obj, field, value)
    else:
        db_obj = Weakness(**data)
        db.add(db_obj)
    return db_obj

def create_multi(db: Session, weaknesses: list[WeaknessCreate]) -> None:
    for weakness in weaknesses:
        create_or_update_weakness(db, weakness)
