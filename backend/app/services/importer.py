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
import json
from app.schemas.cpe_reference import CPEReferenceCreate
from app.crud import cpe_references
import xml.etree.ElementTree as ET
from app.schemas.weakness import WeaknessCreate
import os
import requests
from app.config.urls import CWE_XML_URL, CWE_XML_PATH, CWE_ZIP_PATH
from app.crud import weaknesses as crud_weaknesses
from app.schemas.cve_cpe import CveCpeCreate
from app.schemas.cve_cwe import CveCweCreate
from app.crud import cve_cpe as crud_cve_cpe
from app.crud import cve_cwe as crud_cve_cwe
from app.config.secrets import NVD_API_KEY




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

def extract_all_cpes(configurations: list) -> list[str]:
    cpes = []
    if not configurations:
        print("⚠️ No hay configuraciones en la entrada.")
        return cpes

    print(f"📦 {len(configurations)} configuraciones recibidas.")

    for config in configurations:
        nodes = config.get("nodes", [])
        if nodes:
            print(f"🔹 {len(nodes)} nodos encontrados en configuración.")
        else:
            print("⚠️ Configuración sin nodos.")

        collect_cpes_from_nodes(nodes, cpes)

    return cpes



def collect_cpes_from_nodes(nodes: list, cpes: list[str]):
    """
    Recorre todos los nodos y subnodos para extraer CPEs.
    """
    if not nodes:
        print("⚠️ No hay nodos que recorrer.")
        return

    for node in nodes:
        print("🔎 Analizando nodo:", node.get("operator", "sin operador"))
        
        cpe_matches = node.get("cpeMatch", [])
        print(f"🔹 {len(cpe_matches)} CPE matches encontrados en este nodo.")

        for match in cpe_matches:
            criteria = match.get("criteria") or match.get("cpe23Uri")
            if criteria:
                print(f"✅ CPE encontrado: {criteria}")
                cpes.append(criteria)
            else:
                print("⚠️ CPE sin criteria válido.")

        # Recursivamente buscar en subnodos
        child_nodes = node.get("children", [])
        if child_nodes:
            print(f"🔄 Nodo tiene {len(child_nodes)} hijos, recorriendo...")
            collect_cpes_from_nodes(child_nodes, cpes)



def extract_cvss_data(metrics: dict) -> dict:
    for key, version in [
        ("cvssMetricV31", "3.1"),
        ("cvssMetricV30", "3.0"),
        ("cvssMetricV2", "2.0"),
    ]:
        entries = metrics.get(key)
        if entries and isinstance(entries, list):
            for entry in entries:
                cvss_data = entry.get("cvssData", {})
                if cvss_data:
                    return {
                        "score": str(cvss_data.get("baseScore")),
                        "vector": cvss_data.get("vectorString"),
                        "severity": cvss_data.get("baseSeverity"),
                        "cvss_version": version,

                        # Nivel superior de metrics
                        "exploitability_score": entry.get("exploitabilityScore"),
                        "impact_score": entry.get("impactScore"),
                        "user_interaction_required": entry.get("userInteractionRequired"),
                        "obtain_all_privileges": entry.get("obtainAllPrivilege"),
                        "obtain_user_privileges": entry.get("obtainUserPrivilege"),
                        "obtain_other_privileges": entry.get("obtainOtherPrivilege"),

                        # Campos internos comunes
                        "attack_vector": cvss_data.get("attackVector"),
                        "attack_complexity": cvss_data.get("attackComplexity"),
                        "privileges_required": cvss_data.get("privilegesRequired"),
                        "user_interaction": cvss_data.get("userInteraction"),
                        "scope": cvss_data.get("scope"),
                        "confidentiality_impact": cvss_data.get("confidentialityImpact"),
                        "integrity_impact": cvss_data.get("integrityImpact"),
                        "availability_impact": cvss_data.get("availabilityImpact"),

                        # Solo v2
                        "access_vector": cvss_data.get("accessVector"),
                        "access_complexity": cvss_data.get("accessComplexity"),
                        "authentication": cvss_data.get("authentication"),
                    }
    return {}

def extract_cpes_from_node(node, cpes: list[str]):
    for match in node.get("cpeMatch", []):
        uri = match.get("criteria") or match.get("cpe23Uri")
        if uri:
            cpes.append(uri)
    for child in node.get("children", []):
        extract_cpes_from_node(child, cpes)

def parse_cves_from_nvd(data: dict) -> list[tuple[VulnerabilityCreate, list[dict], list[dict], list[str], list[str]]]:
    results = []

    for item in data.get("vulnerabilities", []):
        cve_data = item.get("cve", {})
        cve_id = cve_data.get("id")

        source_identifier = cve_data.get("sourceIdentifier")
        published_str = cve_data.get("published")
        last_modified_str = cve_data.get("lastModified")
        status = cve_data.get("vulnStatus")

        metrics = cve_data.get("metrics", {})
        cvss = extract_cvss_data(metrics)

        # Descripciones
        descriptions = [
            {"lang": d["lang"], "value": d["value"]}
            for d in cve_data.get("descriptions", [])
        ]

        # Referencias
        references = [
            {
                "url": ref.get("url"),
                "name": ref.get("name"),
                "tags": ",".join(ref.get("tags", [])) if ref.get("tags") else None
            }
            for ref in cve_data.get("references", [])
        ]

        # CPEs desde configurations (con función recursiva plana)
        configurations = cve_data.get("configurations", [])
        cpes = extract_all_cpes(configurations)

        # CWEs desde weaknesses (manteniendo el formato "CWE-123")
        cwes = []
        for problemtype in cve_data.get("weaknesses", []):
            for desc in problemtype.get("description", []):
                val = desc.get("value")
                if val and val.startswith("CWE-"):
                    cwes.append(val)

        vuln = VulnerabilityCreate(
            cve_id=cve_id,
            source_identifier=source_identifier,
            published=published_str,
            last_modified=last_modified_str,
            status=status,
            severity=cvss.get("severity"),
            score=cvss.get("score"),
            vector=cvss.get("vector"),
            cvss_version=cvss.get("cvss_version"),
            exploitability_score=cvss.get("exploitability_score"),
            impact_score=cvss.get("impact_score"),
            user_interaction_required=cvss.get("user_interaction_required"),
            obtain_all_privileges=cvss.get("obtain_all_privileges"),
            obtain_user_privileges=cvss.get("obtain_user_privileges"),
            obtain_other_privileges=cvss.get("obtain_other_privileges"),
            attack_vector=cvss.get("attack_vector"),
            attack_complexity=cvss.get("attack_complexity"),
            privileges_required=cvss.get("privileges_required"),
            user_interaction=cvss.get("user_interaction"),
            scope=cvss.get("scope"),
            confidentiality_impact=cvss.get("confidentiality_impact"),
            integrity_impact=cvss.get("integrity_impact"),
            availability_impact=cvss.get("availability_impact"),
            access_vector=cvss.get("access_vector"),
            access_complexity=cvss.get("access_complexity"),
            authentication=cvss.get("authentication"),
        )

        if not cpes:
            print(f"⚠️ Sin CPEs para {cve_id}")
        else:
            print(f"🔗 CPEs para {cve_id}: {cpes}")


        results.append((vuln, descriptions, references, cpes, cwes))

    return results


def save_cves_to_db(db: Session, data: list[tuple[VulnerabilityCreate, list[dict], list[dict], list[str], list[str]]]) -> int:
    imported = 0

    for vuln_data, desc_dicts, ref_dicts, cpe_uris, cwe_ids in data:
        db_vuln = crud_vulns.create_or_update_vulnerability(db, vuln_data=vuln_data)

        # Descripciones
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

       # Relaciones CVE-CPE con nombres reales
        cve_cpe_relations = [
            CveCpeCreate(cve_name=vuln_data.cve_id, cpe_uri=uri)
            for uri in cpe_uris
        ]
        if cve_cpe_relations:
            print(f"📝 Insertando relaciones CVE-CPE: {cve_cpe_relations}")
            crud_cve_cpe.create_multi(db, cve_cpe_relations)
        else:
            print("⚠️ No hay relaciones CVE-CPE a insertar para este CVE")

        # Relaciones CVE-CWE con nombres como clave
        cve_cwe_relations = [
            CveCweCreate(cve_name=vuln_data.cve_id, cwe_id=cwe)
            for cwe in cwe_ids
        ]
        if cve_cwe_relations:
            crud_cve_cwe.create_multi(db, cve_cwe_relations)


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
        cpe_name_id = cpe_obj.get("cpeNameId")

        if not cpe_uri or not cpe_uri.startswith("cpe:2.3:"):
            continue

        titles = cpe_obj.get("titles", [])
        deprecated = cpe_obj.get("deprecated", False)
        deprecated_by_list = cpe_obj.get("deprecatedBy", [])
        refs = cpe_obj.get("refs", [])  # ⬅️ Aquí extraemos las referencias
        


        created = None
        last_modified = None
        try:
            created_str = cpe_obj.get("created")
            last_modified_str = cpe_obj.get("lastModified")


            created = datetime.fromisoformat(created_str.replace("Z", "+00:00")) if created_str else None
            last_modified = datetime.fromisoformat(last_modified_str.replace("Z", "+00:00")) if last_modified_str else None

        except Exception:
            pass

        results.append(PlatformCreate(
            cpe_uri=cpe_uri,
            cpe_name_id=cpe_name_id,
            deprecated=deprecated,
            deprecated_by=deprecated_by_list[0] if deprecated_by_list else None,
            created=created,
            last_modified=last_modified,
            raw_titles=titles,
            raw_deprecated_by=deprecated_by_list,
            raw_refs=refs
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
                cpe_uri=cpe.get("cpeName", ""),
                cpe_name_id=cpe.get("cpeNameId")
            )
            for cpe in platform.raw_deprecated_by or []
        ]

            if deprecated_entries:
                crud_deprecated.create_multi(db, deprecated_entries)
        
        # Guardar referencias del CPE
        refs = [
            CPEReferenceCreate(
                ref=r.get("ref"),
                type=r.get("type")
            )
            for r in platform.raw_refs or [] if "ref" in r
        ]

        if refs:
            cpe_references.create_multi(db, platform_id=db_platform.id, references=refs)

    db.commit()
    return count

def extract_text(element):
    return element.text.strip() if element is not None and element.text else None

def extract_multiple_as_json(parent, tag, namespace):
    if parent is None:
        return None
    return json.dumps(
        [extract_text(e) for e in parent.findall(tag, namespace) if extract_text(e)],
        ensure_ascii=False
    )

def serialize_elements(parent, path, namespace):
    if parent is None:
        return None
    return json.dumps([
        {child.tag.split('}')[-1]: child.text.strip() if child.text else ""}
        for child in parent.findall(path, namespace)
    ], ensure_ascii=False)

def serialize_blocks(parent, path, namespace, attribs=(), text_fields=()):
    if parent is None:
        return None
    result = []
    for elem in parent.findall(path, namespace):
        block = {}
        for attr in attribs:
            block[attr] = elem.attrib.get(attr)
        for tf in text_fields:
            sub = elem.find(tf, namespace)
            block[tf] = extract_text(sub)
        result.append(block)
    return json.dumps(result, ensure_ascii=False)

def import_all_weaknesses_from_file(filepath: str, db, limit: int = None) -> int:
    tree = ET.parse(filepath)
    root = tree.getroot()

    namespace = {'cwe': 'http://cwe.mitre.org/cwe-7'}  # Namespace único usado

    weaknesses = []

    for elem in root.findall(".//cwe:Weakness", namespace):
        print(f"✅ CWE encontrada: {elem.attrib.get('ID')} - {elem.attrib.get('Name')}")
        try:
            wid = int(elem.attrib.get("ID"))
            name = elem.attrib.get("Name", "")
            abstraction = elem.attrib.get("Abstraction")
            structure = elem.attrib.get("Structure")
            status = elem.attrib.get("Status")

            description = extract_text(elem.find("cwe:Description", namespace))
            extended_description = extract_text(elem.find("cwe:Extended_Description", namespace))
            background_details = extract_text(elem.find("cwe:Background_Details", namespace))

            weaknesses.append(WeaknessCreate(
                id=wid,
                name=name,
                abstraction=abstraction,
                structure=structure,
                status=status,
                description=description,
                extended_description=extended_description,
                background_details=background_details,

                modes_of_introduction=serialize_blocks(elem, "cwe:Modes_Of_Introduction/cwe:Intro", namespace, ("Phase",), ("Note",)),
                applicable_platforms=serialize_elements(elem, "cwe:Applicable_Platforms/*", namespace),
                alternate_terms=extract_multiple_as_json(elem.find("cwe:Alternate_Terms", namespace), "cwe:Term", namespace),
                potential_mitigations=serialize_blocks(elem, "cwe:Potential_Mitigations/cwe:Mitigation", namespace, ("Phase",), ("Description",)),
                consequences=serialize_blocks(elem, "cwe:Consequences/cwe:Consequence", namespace, (), ("Scope", "Impact")),
                demonstrative_examples=serialize_blocks(elem, "cwe:Demonstrative_Examples/cwe:Example", namespace, (), ("Intro_Text", "Body_Text")),
                observed_examples=serialize_elements(elem.find("cwe:Observed_Examples", namespace), "cwe:Observed_Example", namespace),
                taxonomy_mappings=serialize_blocks(elem, "cwe:Taxonomy_Mappings/cwe:Taxonomy_Mapping", namespace, ("Taxonomy_Name", "Entry_ID", "Entry_Name"), ()),
                relationships=serialize_blocks(elem, "cwe:Relationships/cwe:Relationship", namespace, ("Relationship_Type", "Target_CWE_ID", "Target_CWE_Name"), ())
            ))

        except Exception as e:
            print(f"⚠️ Error en CWE {elem.attrib.get('ID')}: {e}")
            continue

    if limit is not None:
        weaknesses = weaknesses[:limit]

    print(f"💡 Total a procesar: {len(weaknesses)}")
    crud_weaknesses.create_multi(db, weaknesses)
    db.commit()
    return len(weaknesses)


def download_weakness_xml_if_needed():
    os.makedirs("data", exist_ok=True)
    if os.path.exists(CWE_XML_PATH):
        print("📄 CWE XML ya existe. No se descarga.")
        return

    print("⬇️ Descargando CWE XML desde MITRE...")
    response = requests.get(CWE_XML_URL)
    if response.status_code != 200:
        raise Exception(f"❌ Error al descargar el XML: {response.status_code}")

    with open(CWE_ZIP_PATH, "wb") as f:
        f.write(response.content)

    import zipfile
    with zipfile.ZipFile(CWE_ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall("data")

    os.remove(CWE_ZIP_PATH)
    print("✅ CWE XML descargado y extraído.")
