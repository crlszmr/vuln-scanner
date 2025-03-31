# backend/app/routes/vulnerabilities.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Vulnerability
from app.routes.auth import get_current_user
from app.schemas import VulnerabilityCreate, VulnerabilityResponse, VulnerabilityUpdate
from app.config.translations import get_message
from app.config.endpoints import *

router = APIRouter(prefix=VULNERABILITIES_BASE, tags=["vulnerabilities"])

@router.get(LIST_VULNERABILITIES, response_model=list[VulnerabilityResponse])
def get_vulnerabilities(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    vulnerabilities = db.query(Vulnerability).all()
    return vulnerabilities

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