# backend/app/services/importer.py
from sqlalchemy.orm import Session
from app.models import Vulnerability
from typing import List, Dict

def extract_vulnerabilities_from_nvd(data: Dict) -> List[Dict]:
    """
    Transforma la respuesta de la NVD API en una lista de diccionarios listos para insertar.
    """
    parsed = []

    for item in data.get("vulnerabilities", []):
        cve_data = item.get("cve", {})
        cve_id = cve_data.get("id")

        descriptions = cve_data.get("descriptions", [])
        english_descriptions = [d for d in descriptions if d.get("lang") == "en"]
        description = english_descriptions[0]["value"] if english_descriptions else ""

        metrics = item.get("metrics", {})
        severity = ""
        if "cvssMetricV31" in metrics:
            severity = metrics["cvssMetricV31"][0]["cvssData"]["baseSeverity"]
        elif "cvssMetricV30" in metrics:
            severity = metrics["cvssMetricV30"][0]["cvssData"]["baseSeverity"]
        elif "cvssMetricV2" in metrics:
            severity = metrics["cvssMetricV2"][0]["cvssData"]["baseSeverity"]

        references = cve_data.get("references", [])
        reference_url = references[0].get("url", "") if references else ""

        print(f"[DEBUG] CVE: {cve_id}, Severity: {severity}, Description: {bool(description)}")

        if cve_id and description:
            parsed.append({
                "cve_id": cve_id,
                "description": description,
                "severity": severity,
                "reference_url": reference_url
            })
    print(f"[DEBUG] Parsed vulnerabilities: {len(parsed)}")

    return parsed


def store_vulnerabilities(db: Session, vulns: List[Dict]) -> int:
    """
    Inserta nuevas vulnerabilidades en la base de datos, evitando duplicados por cve_id.
    Devuelve el número de vulnerabilidades importadas.
    """
    imported = 0

    for v in vulns:
        exists = db.query(Vulnerability).filter_by(cve_id=v["cve_id"]).first()
        if not exists:
            vuln = Vulnerability(**v)
            db.add(vuln)
            imported += 1

    db.commit()
    return imported
