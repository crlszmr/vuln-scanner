# backend/app/services/importer.py
from sqlalchemy.orm import Session
from app.crud import platforms as crud_platforms
from app.crud import vulnerabilities as crud_vulns
from app.models.vulnerability import Vulnerability
from app.schemas.platform import PlatformCreate
from app.schemas.vulnerability import VulnerabilityCreate
from datetime import datetime
from typing import List, Dict
from app.services.nvd import get_cves_by_page, get_cpes_by_page
from app.database import SessionLocal
from app.crud import cve_descriptions as crud_desc
from app.schemas.cve_description import CveDescriptionCreate
from app.schemas.cve_reference import ReferenceCreate
from app.crud import cve_references as crud_refs
from app.schemas.cpe_title import CpeTitleCreate
from app.crud import cpe_titles as crud_titles
from app.schemas.cpe_deprecated_by import CpeDeprecatedByCreate
from app.crud import cpe_deprecated_by as crud_deprecated

def import_all_cves(max_pages: int = 1000, results_per_page: int = 2000) -> int:
    db = SessionLocal()
    total_imported = 0
    page = 0
    finished = False

    try:
        while not finished and page < max_pages:
            start_index = page * results_per_page
            data = get_cves_by_page(start_index=start_index, results_per_page=results_per_page)

            vulns = parse_cves_from_nvd(data)
            if vulns:
                imported = save_cves_to_db(db, vulns)
                total_imported += imported
                if len(vulns) < results_per_page:
                    finished = True  # última página alcanzada
            else:
                finished = True  # no hay más datos que procesar

            page += 1

    finally:
        db.close()

    return total_imported

def parse_cves_from_nvd(data: dict) -> list[tuple[VulnerabilityCreate, list[dict], list[dict]]]:
    results = []

    for item in data.get("vulnerabilities", []):
        cve_data = item.get("cve", {})
        cve_id = cve_data.get("id")

        source_identifier = cve_data.get("sourceIdentifier")
        published_str = cve_data.get("published")
        last_modified_str = cve_data.get("lastModified")
        status = cve_data.get("vulnStatus")

        # Extraer CVSS
        cvss_score = None
        cvss_vector = None
        severity = None
        metrics = cve_data.get("metrics", {})
        if "cvssMetricV31" in metrics:
            cvss_data = metrics["cvssMetricV31"][0]["cvssData"]
        elif "cvssMetricV30" in metrics:
            cvss_data = metrics["cvssMetricV30"][0]["cvssData"]
        elif "cvssMetricV2" in metrics:
            cvss_data = metrics["cvssMetricV2"][0]["cvssData"]
        else:
            cvss_data = None

        if cvss_data:
            cvss_score = str(cvss_data.get("baseScore"))
            cvss_vector = cvss_data.get("vectorString")
            severity = cvss_data.get("baseSeverity")

        # Extraer descripciones
        descriptions = [
            {"lang": d["lang"], "value": d["value"]}
            for d in cve_data.get("descriptions", [])
        ]

        # Extraer referencias
        references = []
        for ref in cve_data.get("references", []):
            references.append({
                "url": ref.get("url"),
                "name": ref.get("name"),  # Solo lo tendrás si usas MITRE
                "tags": ",".join(ref.get("tags", [])) if ref.get("tags") else None
            })

        vuln = VulnerabilityCreate(
            cve_id=cve_id,
            source_identifier=source_identifier,
            published=published_str,
            last_modified=last_modified_str,
            status=status,
            severity=severity,
            score=cvss_score,
            vector=cvss_vector
        )

        results.append((vuln, descriptions, references))

    return results

def save_cves_to_db(db: Session, data: list[tuple[VulnerabilityCreate, list[dict], list[dict]]]) -> int:
    imported = 0

    for vuln_data, desc_dicts, ref_dicts in data:
        db_vuln = crud_vulns.create_or_update_vulnerability(db, vuln_data=vuln_data)

        # Asignamos cve_id real (FK) a cada descripción
        descriptions = [
            CveDescriptionCreate(cve_id=db_vuln.id, lang=d["lang"], value=d["value"])
            for d in desc_dicts
        ]

        if descriptions:
            crud_desc.create_multi(db, descriptions)

        # Referencias
        references = [
            ReferenceCreate(cve_id=db_vuln.id, url=r["url"], name=r.get("name"), tags=r.get("tags"))
            for r in ref_dicts
        ]
        if references:
            crud_refs.create_multi(db, references)

        imported += 1

    return imported

def import_all_cpes(max_pages: int = 100, results_per_page: int = 1000) -> int:
    db = SessionLocal()
    total_imported = 0

    try:
        for page in range(max_pages):  # ✅ Este for ya respeta max_pages
            data = get_cpes_by_page(
                start_index=page * results_per_page,
                results_per_page=results_per_page
            )
            products = data.get("products", [])
            if not products:
                print("❌ No se encontraron más productos. Terminando.")
                break

            parsed_platforms = parse_cpes_from_nvd(data)
            count = save_cpes_to_db(db, parsed_platforms)
            total_imported += count

            print(f"✔ Página {page + 1}: {count} plataformas importadas.")

            if len(products) < results_per_page:
                print("✅ Última página alcanzada (menos de results_per_page).")
                break

        print(f"✅ Total plataformas importadas: {total_imported}")
    finally:
        db.close()

    return total_imported


def parse_cpes_from_nvd(data: dict) -> list[PlatformCreate]:
    results = []

    for item in data.get("products", []):
        cpe_obj = item.get("cpe", {})
        cpe_uri = cpe_obj.get("cpeName")

        if not cpe_uri or not cpe_uri.startswith("cpe:2.3:"):
            continue

        titles = cpe_obj.get("titles", [])
        deprecated = cpe_obj.get("deprecated", False)
        deprecated_by_list = cpe_obj.get("deprecatedBy", [])

        if deprecated:
            print(f"[DEBUG] {cpe_uri} deprecated: True — deprecationDate: {item.get('deprecationDate')}")

        created = None
        last_modified = None
        deprecation_date = None
        try:
            created_str = cpe_obj.get("created")
            last_modified_str = cpe_obj.get("lastModified")
            deprecation_date_str = item.get("deprecationDate")

            created = datetime.fromisoformat(created_str.replace("Z", "+00:00")) if created_str else None
            last_modified = datetime.fromisoformat(last_modified_str.replace("Z", "+00:00")) if last_modified_str else None
            deprecation_date = datetime.fromisoformat(deprecation_date_str.replace("Z", "+00:00")) if deprecation_date_str else None

        except Exception:
            pass

        results.append(PlatformCreate(
            cpe_uri=cpe_uri,
            deprecated=deprecated,
            deprecation_date=deprecation_date,
            deprecated_by=deprecated_by_list[0] if deprecated_by_list else None,
            created=created,
            last_modified=last_modified,
            raw_titles=titles,
            raw_deprecated_by=deprecated_by_list
        ))

    return results




def save_cpes_to_db(db: Session, platforms: list[PlatformCreate]) -> int:
    count = 0

    for platform in platforms:

        # Saltar CPEs antiguos en formato 2.0 por seguridad
        if platform.cpe_uri.startswith("cpe:/"):
            continue

        existing = crud_platforms.get_by_uri(db, platform.cpe_uri)
        if not existing:
            db_platform = crud_platforms.create_platform(db, platform)
            count += 1

            # Títulos (CPE 2.3)
            titles = [
                CpeTitleCreate(
                    platform_id=db_platform.id,
                    lang=t.get("lang", "en"),
                    value=t.get("title", "")
                )
                for t in platform.raw_titles or [] if "title" in t
            ]
            if titles:
                crud_titles.create_multi(db, titles)

            # Deprecated_by entries (CPE 2.3)
            deprecated_entries = [
                CpeDeprecatedByCreate(
                    platform_id=db_platform.id,
                    deprecated_by_cpe=cpe.get("cpeName", "")
                )
                for cpe in platform.raw_deprecated_by or []
            ]

            if deprecated_entries:
                crud_deprecated.create_multi(db, deprecated_entries)

    db.commit()
    return count

