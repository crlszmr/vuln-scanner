# backend/app/crud/vulnerabilities.py
from sqlalchemy.orm import Session
from app.models.vulnerability import Vulnerability
from app.schemas.vulnerability import VulnerabilityCreate

model = Vulnerability

def get_by_cve_id(db: Session, cve_id: str):
    return db.query(Vulnerability).filter(Vulnerability.cve_id == cve_id).first()

def create_or_update_vulnerability(db: Session, vuln_data: VulnerabilityCreate):
    # Excluimos las relaciones (como descriptions) al crear/actualizar directamente
    data = vuln_data.model_dump(exclude={"descriptions"})

    existing = get_by_cve_id(db, vuln_data.cve_id)

    if existing:
        for field, value in data.items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_vuln = Vulnerability(**data)
        db.add(new_vuln)
        db.commit()
        db.refresh(new_vuln)
        return new_vuln

