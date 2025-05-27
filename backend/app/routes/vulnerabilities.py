# backend/app/routes/vulnerabilities.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vulnerability import Vulnerability
from app.models.cve_description import CveDescription
from app.models.cve_reference import CveReference
from app.models.cve_cwe import CveCwe
from app.routes.auth import get_current_user
from app.schemas import VulnerabilityCreate, VulnerabilityResponse, VulnerabilityUpdate, DetailedVulnerabilityResponse
from app.config.translations import get_message
from app.config.endpoints import *

router = APIRouter(prefix=VULNERABILITIES_BASE, tags=["vulnerabilities"])


@router.get(LIST_VULNERABILITIES, response_model=list[VulnerabilityResponse])
def get_vulnerabilities(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return db.query(Vulnerability).all()


@router.post(CREATE_VULNERABILITY, response_model=VulnerabilityResponse)
def create_vulnerability(vuln: VulnerabilityCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    vulnerability = Vulnerability(**vuln.model_dump())
    db.add(vulnerability)
    db.commit()
    db.refresh(vulnerability)
    return vulnerability


@router.put(UPDATE_VULNERABILITY, response_model=VulnerabilityResponse)
def update_vulnerability(id: int, vuln_data: VulnerabilityUpdate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    vulnerability = db.query(Vulnerability).filter(Vulnerability.id == id).first()
    if not vulnerability:
        raise HTTPException(status_code=404, detail=get_message("vuln_not_found", "en"))

    for key, value in vuln_data.model_dump(exclude_unset=True).items():
        setattr(vulnerability, key, value)

    db.commit()
    db.refresh(vulnerability)
    return vulnerability


@router.delete(DELETE_VULNERABILITY)
def delete_vulnerability(id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    vulnerability = db.query(Vulnerability).filter(Vulnerability.id == id).first()
    if not vulnerability:
        raise HTTPException(status_code=404, detail=get_message("vuln_not_found", "en"))

    db.delete(vulnerability)
    db.commit()
    return {"message": get_message("vuln_deleted", "en")}


# ✅ NUEVO ENDPOINT: Obtener detalles completos por cve_id
@router.get("/{cve_id}", response_model=DetailedVulnerabilityResponse)
def get_vulnerability_detail(cve_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    vuln = db.query(Vulnerability).filter(Vulnerability.cve_id == cve_id).first()
    if not vuln:
        raise HTTPException(status_code=404, detail=f"Vulnerability {cve_id} not found")

    # Buscar por vulnerabilidad.id (clave primaria entera)
    descripcion_obj = db.query(CveDescription).filter_by(cve_id=vuln.id, lang="es").first()
    references = db.query(CveReference).filter_by(cve_id=vuln.id).all()
    cwes = db.query(CveCwe).filter_by(cve_name=vuln.cve_id).all()  # esta tabla sí usa cve_id directamente

    return {
        **vuln.__dict__,
        "descripcion": descripcion_obj.value if descripcion_obj else None,
        "references": [{"url": r.url} for r in references],
        "cwe": [c.cwe_id for c in cwes],
    }
