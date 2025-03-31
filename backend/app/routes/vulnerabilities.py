# backend/app/routes/vulnerabilities.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Vulnerability
from app.routes.auth import get_current_user
from app.schemas import VulnerabilityCreate, VulnerabilityResponse, VulnerabilityUpdate
from app.config.translations import get_message
from app.config.endpoints import ENDPOINTS
from app.services.nvd import fetch_cves_by_keyword
from app.services.importer import extract_cves_from_nvd, store_cves


router = APIRouter(prefix="/vulnerabilities", tags=["vulnerabilities"])

# Lista vulnerabilidades
@router.get(ENDPOINTS["list_vulnerabilities_short"], response_model=list[VulnerabilityResponse])
def get_vulnerabilities(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    vulnerabilities = db.query(Vulnerability).all()
    return vulnerabilities

# Crea vulnerabilidad
@router.post(ENDPOINTS["create_vulnerability_short"], response_model=VulnerabilityResponse)
def create_vulnerability(vuln: VulnerabilityCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    vulnerability = Vulnerability(**vuln.model_dump())
    db.add(vulnerability)
    db.commit()
    db.refresh(vulnerability)
    return vulnerability

# Modifica vulnerabilidad
@router.put(ENDPOINTS["update_vulnerability_short"], response_model=VulnerabilityResponse)
def update_vulnerability(vuln_id: int, vuln_data: VulnerabilityUpdate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    vulnerability = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vulnerability:
        raise HTTPException(status_code=404, detail=get_message("vuln_not_found", "en"))
    
    for key, value in vuln_data.model_dump(exclude_unset=True).items():
        setattr(vulnerability, key, value)
    
    db.commit()
    db.refresh(vulnerability)
    return vulnerability

# Elimina vulnerabilidad
@router.delete(ENDPOINTS["delete_vulnerability_short"])
def delete_vulnerability(vuln_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    vulnerability = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vulnerability:
        raise HTTPException(status_code=404, detail=get_message("vuln_not_found", "en"))

    db.delete(vulnerability)
    db.commit()
    
    return {"message": get_message("vuln_deleted", "en")}