from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.weakness import Weakness
from app.schemas.weakness import Weakness as WeaknessSchema
import json

router = APIRouter(prefix="/weaknesses", tags=["Weaknesses"])

@router.get("/{cwe_id}", response_model=WeaknessSchema)
def get_weakness_by_id(cwe_id: str, db: Session = Depends(get_db)):
    try:
        if cwe_id.upper().startswith("CWE-"):
            cwe_number = int(cwe_id.replace("CWE-", ""))
        else:
            cwe_number = int(cwe_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de CWE inválido")

    weakness = db.query(Weakness).filter(Weakness.id == cwe_number).first()
    if not weakness:
        raise HTTPException(status_code=404, detail=f"Weakness {cwe_id} not found")

    # Deserializar campos tipo JSON (almacenados como Text)
    json_fields = [
        "modes_of_introduction", "applicable_platforms", "alternate_terms",
        "potential_mitigations", "consequences", "demonstrative_examples",
        "observed_examples", "taxonomy_mappings", "relationships"
    ]

    for field in json_fields:
        value = getattr(weakness, field)
        if isinstance(value, str) and value.strip():
            try:
                setattr(weakness, field, json.loads(value))
            except json.JSONDecodeError:
                setattr(weakness, field, [])

    return weakness
