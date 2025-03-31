# backend/app/crud/vulnerabilities.py
from sqlalchemy.orm import Session
from app.models import Vulnerability

def create_or_update_vulnerability(db: Session, cve_data: dict):
    cve_id = cve_data["cve"]["id"]
    description = cve_data["cve"]["descriptions"][0]["value"]
    severity = (
        cve_data.get("cve", {})
        .get("metrics", {})
        .get("cvssMetricV31", [{}])[0]
        .get("cvssData", {})
        .get("baseSeverity", "UNKNOWN")
    )

    vuln = db.query(Vulnerability).filter_by(cve_id=cve_id).first()
    if vuln:
        vuln.description = description
        vuln.severity = severity
    else:
        vuln = Vulnerability(cve_id=cve_id, description=description, severity=severity)
        db.add(vuln)

    db.commit()
    db.refresh(vuln)
    return vuln