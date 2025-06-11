import os
import json
from datetime import datetime
from typing import List, Tuple
from sqlalchemy import select, text, func
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from app.database import SessionLocal
from app.models.vulnerability import Vulnerability
from app.models.cve_description import CveDescription
from app.models.cve_reference import CveReference
from app.models.cve_cpe import CveCpe
from app.models.cve_cwe import CveCwe
from app.schemas.vulnerability import VulnerabilityCreate
from app.services.nvd import (
    get_all_cve_ids,
    get_total_cve_count_from_nvd,
    get_cves_by_id,
    get_cves_by_page
)
from app.services import import_status
from app.services.imports import (
    extract_all_cpes,
    extract_cvss_data,
    crud_vulns
)


def log(msg: str):
    """Registra mensajes con timestamp."""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")


def parse_cves_from_nvd(data: dict) -> List[Tuple[VulnerabilityCreate, list, list, list, list]]:
    results = []
    for item in data.get('vulnerabilities', []):
        cve_data = item.get('cve', {})
        cve_id = cve_data.get('id')
        source_identifier = cve_data.get('sourceIdentifier')
        published_str = cve_data.get('published')
        last_modified_str = cve_data.get('lastModified')
        status = cve_data.get('vulnStatus')
        metrics = cve_data.get('metrics', {})
        cvss = extract_cvss_data(metrics)
        descriptions = [{'lang': d['lang'], 'value': d['value']} for d in cve_data.get('descriptions', [])]
        references = [
            {
                'url': ref.get('url'),
                'name': ref.get('name'),
                'tags': ','.join(ref.get('tags', [])) if ref.get('tags') else None
            }
            for ref in cve_data.get('references', [])
        ]
        configurations = cve_data.get('configurations', [])
        cpes = extract_all_cpes(configurations)
        cwes = []
        for problemtype in cve_data.get('weaknesses', []):
            for desc in problemtype.get('description', []):
                val = desc.get('value')
                if val and val.startswith('CWE-'):
                    cwes.append(val)

        vuln = VulnerabilityCreate(
            cve_id=cve_id,
            source_identifier=source_identifier,
            published=published_str,
            last_modified=last_modified_str,
            status=status,
            severity=cvss.get('severity'),
            score=cvss.get('score'),
            vector=cvss.get('vector'),
            cvss_version=cvss.get('cvss_version'),
            exploitability_score=cvss.get('exploitability_score'),
            impact_score=cvss.get('impact_score'),
            user_interaction_required=cvss.get('user_interaction_required'),
            obtain_all_privileges=cvss.get('obtain_all_privileges'),
            obtain_user_privileges=cvss.get('obtain_user_privileges'),
            obtain_other_privileges=cvss.get('obtain_other_privileges'),
            attack_vector=cvss.get('attack_vector'),
            attack_complexity=cvss.get('attack_complexity'),
            privileges_required=cvss.get('privileges_required'),
            user_interaction=cvss.get('user_interaction'),
            scope=cvss.get('scope'),
            confidentiality_impact=cvss.get('confidentiality_impact'),
            integrity_impact=cvss.get('integrity_impact'),
            availability_impact=cvss.get('availability_impact'),
            access_vector=cvss.get('access_vector'),
            access_complexity=cvss.get('access_complexity'),
            authentication=cvss.get('authentication')
        )
        results.append((vuln, descriptions, references, cpes, cwes))
    return results


def save_cves_to_db(db: Session, data: List[Tuple[VulnerabilityCreate, list, list, list, list]]) -> int:
    imported = 0
    cve_id_map = {}
    all_descs, all_refs, all_cpes, all_cwes = [], [], [], []

    all_ids = [vuln_data.cve_id for vuln_data, *_ in data]
    existing_ids = {
        row[0] for row in db.query(Vulnerability.cve_id).filter(Vulnerability.cve_id.in_(all_ids)).all()
    }

    for vuln_data, *_ in data:
        if vuln_data.cve_id in existing_ids:
            continue
        db_vuln = crud_vulns.create_or_update_vulnerability(db, vuln_data=vuln_data)
        cve_id_map[vuln_data.cve_id] = db_vuln.id
        imported += 1

    for vuln_data, desc_dicts, ref_dicts, cpe_uris, cwe_ids in data:
        cve_name = vuln_data.cve_id
        cve_id = cve_id_map.get(cve_name)
        if not cve_id:
            continue

        all_descs.extend([
            {"cve_id": cve_id, "lang": d["lang"], "value": d["value"]}
            for d in desc_dicts
        ])

        seen_refs = set()
        for r in ref_dicts:
            key = (r["url"], cve_id)
            if key not in seen_refs:
                seen_refs.add(key)
                all_refs.append({
                    "cve_id": cve_id,
                    "url": r["url"],
                    "name": r.get("name"),
                    "tags": r.get("tags")
                })

        seen_cpes = set()
        for uri in cpe_uris:
            key = (cve_name, uri)
            if key not in seen_cpes:
                seen_cpes.add(key)
                all_cpes.append({"cve_name": cve_name, "cpe_uri": uri})

        seen_cwes = set()
        for cwe in cwe_ids:
            key = (cve_name, cwe)
            if key not in seen_cwes:
                seen_cwes.add(key)
                all_cwes.append({"cve_name": cve_name, "cwe_id": cwe})

    if all_descs:
        db.bulk_insert_mappings(CveDescription, all_descs)

    if all_refs:
        db.bulk_insert_mappings(CveReference, all_refs)

    if all_cpes:
        stmt = insert(CveCpe).values(all_cpes)
        stmt = stmt.on_conflict_do_nothing(index_elements=["cve_name", "cpe_uri"])
        db.execute(stmt)

    if all_cwes:
        stmt = insert(CveCwe).values(all_cwes)
        stmt = stmt.on_conflict_do_nothing(index_elements=["cve_name", "cwe_id"])
        db.execute(stmt)

    db.commit()
    return imported


async def import_all_cves_stream(results_per_page: int = 2000):
    from fastapi import Request
    import asyncio

    db = SessionLocal()
    total_imported = 0
    EXCESSIVE_NEW_CVES_THRESHOLD = 1000

    try:
        existing_count = db.execute(text("SELECT COUNT(*) FROM vulnerabilities")).scalar()

        if existing_count == 0:
            total_results = get_total_cve_count_from_nvd()
            yield json.dumps({"type": "start", "total": total_results, "label": "Cargando..."})
            total_pages = (total_results // results_per_page) + 1
            for page in range(total_pages):
                if import_status.should_stop():
                    yield json.dumps({"type": "done", "imported": total_imported, "label": "Importación detenida por el usuario"})
                    return
                start_index = page * results_per_page
                data = get_cves_by_page(start_index=start_index, results_per_page=results_per_page)
                vulns_data_parsed = parse_cves_from_nvd(data)
                for i in range(0, len(vulns_data_parsed), 50):
                    if import_status.should_stop():
                        yield json.dumps({"type": "done", "imported": total_imported, "label": "Importación detenida por el usuario"})
                        return
                    sub_batch = vulns_data_parsed[i:i + 50]
                    imported_in_subbatch = save_cves_to_db(db, sub_batch)
                    total_imported += imported_in_subbatch
                    yield json.dumps({"type": "progress", "imported": total_imported, "total": total_results})
                    await asyncio.sleep(0.001)
            yield json.dumps({"type": "done", "imported": total_imported, "label": "Importación completada."})
            return

        nvd_total_results = get_total_cve_count_from_nvd()
        db_total_results = db.execute(select(func.count(Vulnerability.cve_id))).scalar()
        estimated_to_import = nvd_total_results - db_total_results

        if estimated_to_import > EXCESSIVE_NEW_CVES_THRESHOLD:
            yield json.dumps({"type": "start", "total": estimated_to_import, "label": "Demasiados CVEs nuevos detectados", "stage": "check_estimation"})
            await asyncio.sleep(0.01)
            yield json.dumps({"type": "warning", "code": "too_many_new_cves"})
            return

        if nvd_total_results == db_total_results:
            yield json.dumps({"type": "done", "imported": 0, "label": "No hay nuevos CVEs que importar."})
            return

        estimated_nvd_pages = (nvd_total_results // results_per_page) + 1
        yield json.dumps({"type": "start", "total": estimated_nvd_pages, "label": "Obteniendo lista de CVEs desde NVD para comparación...", "percentage": 0, "stage": "fetching_ids"})

        all_nvd_ids = []
        page_processed_count = 0
        for page_ids_batch in get_all_cve_ids(results_per_page=results_per_page):
            all_nvd_ids.extend(page_ids_batch)
            page_processed_count += 1
            current_percentage = round((page_processed_count / estimated_nvd_pages) * 100) if estimated_nvd_pages > 0 else 0
            yield json.dumps({"type": "progress", "imported": page_processed_count, "total": estimated_nvd_pages, "percentage": current_percentage, "label": "Obteniendo lista de CVEs desde NVD...", "stage": "fetching_ids"})
            await asyncio.sleep(0.001)

        db_cve_ids = set(db.execute(select(Vulnerability.cve_id)).scalars().all())
        new_cve_ids = [cve_id for cve_id in all_nvd_ids if cve_id.strip().upper() not in db_cve_ids]
        total_to_import = len(new_cve_ids)

        if total_to_import == 0:
            yield json.dumps({"type": "done", "imported": 0, "label": "No hay nuevos CVEs que importar."})
            return

        yield json.dumps({"type": "start", "total": total_to_import, "label": "Importando CVEs faltantes...", "percentage": 0, "stage": "importing_cves"})

        current_imported = 0
        for i in range(0, total_to_import, 10):
            if import_status.should_stop():
                break
            batch_ids = new_cve_ids[i:i + 10]
            data_from_nvd = get_cves_by_id(batch_ids)
            vulns_data_parsed = parse_cves_from_nvd(data_from_nvd)
            if vulns_data_parsed:
                imported_in_batch = save_cves_to_db(db, vulns_data_parsed)
                total_imported += imported_in_batch
                current_imported += imported_in_batch
            current_percentage = round((current_imported / total_to_import) * 100) if total_to_import > 0 else 0
            yield json.dumps({"type": "progress", "imported": current_imported, "total": total_to_import, "percentage": current_percentage, "label": f"Importando CVEs faltantes ({current_percentage}% completado)", "stage": "importing_cves"})
            await asyncio.sleep(0.001)

        yield json.dumps({"type": "done", "imported": total_imported, "label": "Importación completada."})

    except Exception as e:
        error_msg = f"Error durante la importación: {str(e)}"
        yield json.dumps({"type": "error", "message": error_msg})
        db.rollback()
    finally:
        db.close()
