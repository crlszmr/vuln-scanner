from sqlalchemy import select, text
from .imports import *
import os
from sqlalchemy.dialects.postgresql import insert
from app.services.nvd import get_total_cve_count_from_nvd


def parse_cves_from_feed(data: dict) -> list[tuple[VulnerabilityCreate, list[dict], list[dict], list[str], list[str]]]:
    results = []
    for item in data.get('CVE_Items', []):
        try:
            cve_data = item.get('cve', {})
            cve_id = cve_data.get('CVE_data_meta', {}).get('ID')
            source_identifier = cve_data.get('CVE_data_meta', {}).get('ASSIGNER')
            published_str = item.get('publishedDate')
            last_modified_str = item.get('lastModifiedDate')
            status = None
            metrics = item.get('impact', {})
            cvss = extract_cvss_data_from_feed(metrics)
            description_list = []
            desc_block = cve_data.get('description', {})
            if isinstance(desc_block, dict):
                for entry in desc_block.get('description_data', []):
                    if isinstance(entry, dict):
                        description_list.append({'lang': entry.get('lang'), 'value': entry.get('value')})
            reference_list = []
            refs_block = cve_data.get('references', {})
            if isinstance(refs_block, dict):
                for ref in refs_block.get('reference_data', []):
                    if isinstance(ref, dict):
                        reference_list.append({'url': ref.get('url'), 'name': ref.get('name'), 'tags': ','.join(ref.get('tags', [])) if ref.get('tags') else None})
            cpes = []
            configurations = item.get('configurations', {})
            if isinstance(configurations, dict):
                cpes = extract_cpes_from_feed_config(configurations)
            cwes = []
            problemtype = cve_data.get('problemtype', {})
            if isinstance(problemtype, dict):
                for ptype in problemtype.get('problemtype_data', []):
                    if isinstance(ptype, dict):
                        desc_entries = ptype.get('description', [])
                        if isinstance(desc_entries, list):
                            for desc in desc_entries:
                                if isinstance(desc, dict):
                                    val = desc.get('value')
                                    if val and val.startswith('CWE-'):
                                        cwes.append(val)
            vuln = VulnerabilityCreate(cve_id=cve_id, source_identifier=source_identifier, published=published_str, last_modified=last_modified_str, status=status, severity=cvss.get('severity'), score=cvss.get('score'), vector=cvss.get('vector'), cvss_version=cvss.get('cvss_version'), exploitability_score=cvss.get('exploitability_score'), impact_score=cvss.get('impact_score'), user_interaction_required=cvss.get('user_interaction_required'), obtain_all_privileges=cvss.get('obtain_all_privileges'), obtain_user_privileges=cvss.get('obtain_user_privileges'), obtain_other_privileges=cvss.get('obtain_other_privileges'), attack_vector=cvss.get('attack_vector'), attack_complexity=cvss.get('attack_complexity'), privileges_required=cvss.get('privileges_required'), user_interaction=cvss.get('user_interaction'), scope=cvss.get('scope'), confidentiality_impact=cvss.get('confidentiality_impact'), integrity_impact=cvss.get('integrity_impact'), availability_impact=cvss.get('availability_impact'), access_vector=cvss.get('access_vector'), access_complexity=cvss.get('access_complexity'), authentication=cvss.get('authentication'))
            results.append((vuln, description_list, reference_list, cpes, cwes))
        except Exception as e:
            print(f"❌ Error parseando CVE {cve_id or 'UNKNOWN'}: {type(e).__name__}: {e}")
            print('🔎 Entrada conflictiva:', json.dumps(item, indent=2))
    return results

def import_all_cves_from_files(directory: str='data') -> int:
    from app.services.importer import parse_cves_from_nvd, save_cves_to_db
    from app.database import SessionLocal
    os.makedirs(directory, exist_ok=True)
    current_year = datetime.now().year
    years = list(range(2002, current_year + 1))
    for year in years:
        filename = f'nvdcve-1.1-{year}.json.gz'
        filepath = os.path.join(directory, filename)
        if not os.path.exists(filepath):
            url = f'https://nvd.nist.gov/feeds/json/cve/1.1/{filename}'
            print(f'⬇️ Descargando {filename} desde {url}...')
            response = requests.get(url)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                print(f'✅ {filename} guardado en {filepath}')
            else:
                print(f'⚠️ No se pudo descargar {filename} (status: {response.status_code})')
    db = SessionLocal()
    total_imported = 0
    try:
        files = sorted([f for f in os.listdir(directory) if f.startswith('nvdcve-1.1-') and f.endswith('.json.gz')])
        for filename in files:
            filepath = os.path.join(directory, filename)
            print(f'📥 Procesando archivo: {filepath}')
            with gzip.open(filepath, 'rt', encoding='utf-8') as f:
                data = json.load(f)
                vulns = parse_cves_from_nvd(data)
                print(f"🔍 CVEs parseados: {len(vulns)} de {len(data.get('vulnerabilities', []))}")
                imported = save_cves_to_db(db, vulns)
                print(f"✅ CVEs insertados: {imported}")
                total_imported += imported
                print(f'✅ {imported} CVEs importados desde {filename}')
    finally:
        db.close()
    return total_imported

def import_all_cves(results_per_page: int = 500) -> int:
    from app.services.nvd import get_cves_by_page
    from app.database import SessionLocal
    import time

    start_time = time.time()

    db = SessionLocal()
    total_imported = 0
    total_results = get_total_cve_count_from_nvd()
    total_pages = total_results // results_per_page + 1
    max_workers = 6

    print(f"🚀 Importando {total_results} CVEs en {total_pages} páginas usando {max_workers} hilos")

    def fetch_and_parse(page: int):
        start_index = page * results_per_page
        data = get_cves_by_page(start_index=start_index, results_per_page=results_per_page)
        return parse_cves_from_nvd(data)

    try:
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_page = {executor.submit(fetch_and_parse, page): page for page in range(total_pages)}
            for future in as_completed(future_to_page):
                page = future_to_page[future]
                try:
                    vulns = future.result()
                    if vulns:
                        imported = save_cves_to_db(db, vulns)
                        total_imported += imported
                        print(f"📦 Página {page + 1}/{total_pages} importada ({imported} CVEs)", flush=True)
                except Exception as e:
                    print(f"❌ Error en página {page + 1}: {str(e)}")
    finally:
        db.close()

    elapsed = time.time() - start_time
    print(f"\n✅ Importación de CVEs completada: {total_imported} registros en {elapsed:.2f} segundos.")
    return total_imported

def parse_cves_from_nvd(data: dict) -> list[tuple[VulnerabilityCreate, list[dict], list[dict], list[str], list[str]]]:
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
        references = [{'url': ref.get('url'), 'name': ref.get('name'), 'tags': ','.join(ref.get('tags', [])) if ref.get('tags') else None} for ref in cve_data.get('references', [])]
        configurations = cve_data.get('configurations', [])
        cpes = extract_all_cpes(configurations)
        cwes = []
        for problemtype in cve_data.get('weaknesses', []):
            for desc in problemtype.get('description', []):
                val = desc.get('value')
                if val and val.startswith('CWE-'):
                    cwes.append(val)
        vuln = VulnerabilityCreate(cve_id=cve_id, source_identifier=source_identifier, published=published_str, last_modified=last_modified_str, status=status, severity=cvss.get('severity'), score=cvss.get('score'), vector=cvss.get('vector'), cvss_version=cvss.get('cvss_version'), exploitability_score=cvss.get('exploitability_score'), impact_score=cvss.get('impact_score'), user_interaction_required=cvss.get('user_interaction_required'), obtain_all_privileges=cvss.get('obtain_all_privileges'), obtain_user_privileges=cvss.get('obtain_user_privileges'), obtain_other_privileges=cvss.get('obtain_other_privileges'), attack_vector=cvss.get('attack_vector'), attack_complexity=cvss.get('attack_complexity'), privileges_required=cvss.get('privileges_required'), user_interaction=cvss.get('user_interaction'), scope=cvss.get('scope'), confidentiality_impact=cvss.get('confidentiality_impact'), integrity_impact=cvss.get('integrity_impact'), availability_impact=cvss.get('availability_impact'), access_vector=cvss.get('access_vector'), access_complexity=cvss.get('access_complexity'), authentication=cvss.get('authentication'))
        results.append((vuln, descriptions, references, cpes, cwes))
    return results

def save_cves_to_db(db: Session, data: list[tuple[VulnerabilityCreate, list[dict], list[dict], list[str], list[str]]]) -> int:
    imported = 0
    cve_id_map = {}

    all_descs, all_refs, all_cpes, all_cwes = [], [], [], []

    # Paso 0: obtener los CVEs ya existentes en BD
    all_ids = [vuln_data.cve_id for vuln_data, *_ in data]
    existing_ids = {
        row[0] for row in db.query(Vulnerability.cve_id).filter(Vulnerability.cve_id.in_(all_ids)).all()
    }

    # Paso 1: insertar solo los nuevos CVEs
    for vuln_data, *_ in data:
        if vuln_data.cve_id in existing_ids:
            continue
        db_vuln = crud_vulns.create_or_update_vulnerability(db, vuln_data=vuln_data)
        cve_id_map[vuln_data.cve_id] = db_vuln.id
        imported += 1

    # Paso 2: procesar los demás registros vinculados
    for vuln_data, desc_dicts, ref_dicts, cpe_uris, cwe_ids in data:
        cve_name = vuln_data.cve_id
        cve_id = cve_id_map.get(cve_name)
        if not cve_id:
            continue  # ya existía

        # Descripciones
        all_descs.extend([
            {"cve_id": cve_id, "lang": d["lang"], "value": d["value"]}
            for d in desc_dicts
        ])

        # Referencias únicas
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

        # CPEs únicas
        seen_cpes = set()
        for uri in cpe_uris:
            key = (cve_name, uri)
            if key not in seen_cpes:
                seen_cpes.add(key)
                all_cpes.append({"cve_name": cve_name, "cpe_uri": uri})

        # CWEs únicas
        seen_cwes = set()
        for cwe in cwe_ids:
            key = (cve_name, cwe)
            if key not in seen_cwes:
                seen_cwes.add(key)
                all_cwes.append({"cve_name": cve_name, "cwe_id": cwe})

    # Paso 3: inserciones masivas (con on_conflict para evitar duplicados)
    from sqlalchemy.dialects.postgresql import insert

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



def clean_text(value: str) -> str:
    return value.replace("\n", "").replace("\r", "").strip()

async def import_all_cves_stream(results_per_page=2000):
    from app.services.nvd import get_cves_by_id, get_all_cve_ids, get_cves_by_page
    from app.database import SessionLocal
    from app.services.importer import parse_cves_from_nvd, save_cves_to_db, get_total_cve_count_from_nvd
    from sqlalchemy import text
    import asyncio
    import json

    db = SessionLocal()
    total_imported = 0

    try:
        # Si la base de datos está vacía, hacemos carga completa por páginas
        existing_count = db.execute(text("SELECT COUNT(*) FROM vulnerabilities")).scalar()

        if existing_count == 0:
            print("📂 BD vacía. Cargando todos los CVEs desde NVD.")
            total_results = get_total_cve_count_from_nvd()
            yield json.dumps({"type": "start", "total": total_results})

            total_pages = (total_results // results_per_page) + 1

            for page in range(total_pages):
                start_index = page * results_per_page
                print(f"🌍 Página {page+1}/{total_pages} (startIndex={start_index})")
                data = get_cves_by_page(start_index=start_index, results_per_page=results_per_page)
                vulns = parse_cves_from_nvd(data)

                if vulns:
                    chunk_size = 50
                    for j in range(0, len(vulns), chunk_size):
                        chunk = vulns[j:j + chunk_size]
                        before = total_imported
                        imported = save_cves_to_db(db, chunk)
                        total_imported += imported

                        yield json.dumps({
                            "type": "progress",
                            "imported": total_imported,
                            "total": total_results
                        })
                        await asyncio.sleep(0.001)

            yield json.dumps({"type": "done", "imported": total_imported})
            print(f"✅ Carga completa finalizada: {total_imported} CVEs insertados.")
            return

        # Proceso incremental (BD ya tiene datos)
        print("🔎 Iniciando proceso incremental (solo nuevos CVEs)...")

        yield json.dumps({
            "type": "label",
            "label": "Comprobando si hay nuevos CVEs en la NVD..."
        })


        # Obtener todos los CVEs actuales desde NVD
        all_cve_ids = list(get_all_cve_ids())
        if not all_cve_ids:
            yield json.dumps({
                "type": "error",
                "message": "No se pudieron obtener los CVE IDs desde la NVD"
            })
            return
        print(f"📋 Total CVEs en NVD: {len(all_cve_ids)}")

        # Obtener los CVE_ID existentes en la base de datos
        existing_ids = set(
            str(cve_id).strip().upper()
            for (cve_id,) in db.execute(text("SELECT cve_id FROM vulnerabilities")).fetchall()
        )

        # Filtrar solo los que no están en la BD
        new_cve_ids = [cve_id for cve_id in all_cve_ids if str(cve_id).strip().upper() not in existing_ids]
        total_new = len(new_cve_ids)
        print(f"🆕 Nuevos CVEs detectados: {total_new}")

        # 🔔 Emitir evento start inmediatamente como en el caso de BD vacía
        yield json.dumps({"type": "start", "total": total_new, "label": "Importando nuevos CVEs..."})

        if total_new == 0:
            yield json.dumps({"type": "done", "imported": 0})
            print("⚠️ No hay nuevos CVEs que importar.")
            return

        # Procesar en batches
        batch_size = 10
        for i in range(0, total_new, batch_size):

            batch_ids = new_cve_ids[i:i + batch_size]
            print(f"📤 Procesando batch: {batch_ids}")

            data = get_cves_by_id(batch_ids)
            vulns = parse_cves_from_nvd(data)
            imported = save_cves_to_db(db, vulns)
            total_imported += imported

            yield json.dumps({
                "type": "progress",
                "imported": total_imported,
                "total": total_new
            })
            await asyncio.sleep(0.001)

        yield json.dumps({"type": "done", "imported": total_imported})
        print(f"✅ Proceso incremental finalizado: {total_imported} nuevos CVEs insertados.")

    except Exception as e:
        err = {"type": "error", "message": clean_text(str(e))}
        print("❌ Error:", err)
        yield json.dumps(err)
        db.rollback()
    finally:
        db.close()








async def import_all_cves_from_files_stream(directory: str = "data"):
    os.makedirs(directory, exist_ok=True)
    current_year = datetime.now().year
    years = list(range(2002, current_year + 1))
    total_imported = 0
    processed_files = 0

    for year in years:
        filename = f"nvdcve-1.1-{year}.json.gz"
        filepath = os.path.join(directory, filename)
        if not os.path.exists(filepath):
            url = f"https://nvd.nist.gov/feeds/json/cve/1.1/{filename}"
            response = requests.get(url)
            if response.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(response.content)
                yield json.dumps({"type": "download", "file": filename, "status": "ok"})
            else:
                yield json.dumps({"type": "download", "file": filename, "status": "failed"})

    db = SessionLocal()
    print("✅ Base de datos inicializada correctamente")

    try:
        files = sorted([
            f for f in os.listdir(directory)
            if f.startswith("nvdcve-1.1-") and f.endswith(".json.gz")
        ])
        total_files = len(files)
        yield json.dumps({"type": "start", "files": total_files})

        for filename in files:
            filepath = os.path.join(directory, filename)
            print(f"📂 Procesando archivo: {filename}")
            try:
                json_path = decompress_once(filepath)
                with open(json_path, "rb") as f:
                    start_parse = time.time()
                    vulns = []
                    for item in ijson.items(f, "CVE_Items.item"):
                        try:
                            result = parse_cves_from_feed({"CVE_Items": [item]})
                            vulns.extend(result)
                        except Exception as e:
                            print(f"❌ Error parseando CVE del archivo {filename}: {e}")
                    print(f"⏱️ Parseado {len(vulns)} CVEs en {time.time() - start_parse:.2f}s")

                start_save = time.time()
                imported = save_cves_to_db(db, vulns)
                print(f"💾 Guardado en {time.time() - start_save:.2f}s")

                total_imported += imported
                processed_files += 1

                yield json.dumps({
                    "type": "progress",
                    "file": filename,
                    "imported": total_imported,
                    "current": processed_files,
                    "total": total_files
                })

                await asyncio.sleep(0.01)

            except Exception as e:
                print(f"❌ Error procesando {filename}: {str(e)}")
                yield json.dumps({"type": "error", "message": f"{filename}: {str(e)}"})

        yield json.dumps({"type": "done", "imported": total_imported})

    except Exception as e:
        yield json.dumps({"type": "error", "message": str(e)})
        db.rollback()
    finally:
        db.close()

