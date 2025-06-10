from sqlalchemy import select, text
from .imports import *
import os
from sqlalchemy.dialects.postgresql import insert
from app.services.nvd import get_all_cve_ids, get_total_cve_count_from_nvd, get_cves_by_id # Asegúrate de que get_cves_by_id esté aquí



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

# app/services/cve_importer.py

from sqlalchemy import select, text
# No importamos _stop_event aquí
# from .imports import * # Asegúrate de que esto no importe _stop_event
import os
from sqlalchemy.dialects.postgresql import insert
from app.services.nvd import get_total_cve_count_from_nvd, get_all_cve_ids, get_cves_by_id, get_cves_by_page
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.vulnerability import Vulnerability
from sqlalchemy import func
import json # Asegurarse de que json esté importado

# Asegúrate de que el 't' para traducciones esté disponible si lo usas aquí,
# o si no, usa directamente los strings.
# Por simplicidad, voy a usar strings directos en esta versión, asumiendo que las traducciones
# se aplican en el frontend o en un nivel superior si 't' no está disponible aquí.
# Si 't' es una función que puedes importar o pasar, puedes mantenerla.
# Para este ejemplo, usaré strings literales que corresponden a lo que 't' traduciría.

# ... (otras funciones como parse_cves_from_nvd, save_cves_to_db, clean_text) ...

async def import_all_cves_stream(results_per_page=2000):
    db = SessionLocal()
    total_imported = 0
    EXCESSIVE_NEW_CVES_THRESHOLD = 1000

    try:
        existing_count = db.execute(text("SELECT COUNT(*) FROM vulnerabilities")).scalar()

        if existing_count == 0:
            print("📂 BD vacía. Cargando todos los CVEs desde NVD.")
            total_results = get_total_cve_count_from_nvd()
            yield json.dumps({"type": "start", "total": total_results, "label": "Cargando..."})

            total_pages = (total_results // results_per_page) + 1# <--- esta línea es clave


            # Iterar por páginas para la importación completa
            current_cve_count = 0 # Para llevar un conteo de CVEs procesados en la importación completa
            for page in range(total_pages):
                start_index = page * results_per_page
                print(f"🌍 Página {page+1}/{total_pages} (startIndex={start_index})")
                data = get_cves_by_page(start_index=start_index, results_per_page=results_per_page)
                vulns_data_parsed = parse_cves_from_nvd(data)

                if vulns_data_parsed:
                    batch_size = 50
                    for i in range(0, len(vulns_data_parsed), batch_size):
                        sub_batch = vulns_data_parsed[i:i + batch_size]
                        imported_in_subbatch = save_cves_to_db(db, sub_batch)
                        total_imported += imported_in_subbatch

                        yield json.dumps({
                        "type": "progress",
                        "imported": total_imported,
                        "total": total_results
                        })
                        await asyncio.sleep(0.001)

            yield json.dumps({"type": "done", "imported": total_imported, "label": "Importación completada."})
            print(f"✅ Carga completa finalizada: {total_imported} CVEs insertados.")
            return

        # BD tiene datos → proceso incremental
        print("🔎 Iniciando proceso incremental (solo CVEs faltantes)...")

        print("Obteniendo el conteo total de CVEs en NVD y en la base de datos...")
        nvd_total_results = get_total_cve_count_from_nvd()
        db_total_results = db.execute(select(func.count(Vulnerability.cve_id))).scalar()
        print(f"📊 Conteo de NVD: {nvd_total_results}, Conteo en BD: {db_total_results}")
        if nvd_total_results == db_total_results:
            yield json.dumps({
                "type": "done",
                "imported": 0,
                "label": "No hay nuevos CVEs que importar."
            })
            print("✅ No hay nuevos CVEs que importar (conteo de NVD y BD coinciden).")
            return

        # Fase 1: Descargando todos los CVE IDs de NVD para comparación
        # El total de esta fase será el número de CVEs en NVD, no las páginas.
        # Esto permitirá que el porcentaje refleje la descarga de los IDs individuales
        # o el progreso general de la fase, no solo las páginas.
        # Si get_all_cve_ids ya maneja el progreso interno y la paginación,
        # podríamos refactorizar para que emita eventos progress directamente.
        # Por ahora, mantendremos la estimación por páginas para el porcentaje de esta fase.

        estimated_nvd_pages = (nvd_total_results // results_per_page) + (1 if nvd_total_results % results_per_page > 0 else 0)

        yield json.dumps({
            "type": "start",
            "total": estimated_nvd_pages, # El total es el número de páginas a recorrer para obtener IDs
            "label": "Obteniendo lista de CVEs desde NVD para comparación...",
            "percentage": 0,
            "stage": "fetching_ids"
        })

        print("🌐 Descargando todos los CVE IDs de NVD para comparación...")
        all_nvd_ids = []
        page_processed_count = 0
        for page_ids_batch in get_all_cve_ids(results_per_page=results_per_page):
            all_nvd_ids.extend(page_ids_batch)
            page_processed_count += 1
            
            current_percentage = round((page_processed_count / estimated_nvd_pages) * 100) if estimated_nvd_pages > 0 else 0
            yield json.dumps({
                "type": "progress",
                "imported": page_processed_count, # Los "imported" aquí son las páginas procesadas
                "total": estimated_nvd_pages,    # El "total" aquí son las páginas totales a procesar
                "percentage": current_percentage,
                "label": f"Obteniendo lista de CVEs desde NVD...",
                "stage": "fetching_ids"
            })
            await asyncio.sleep(0.001)

        print(f"✅ Se han descargado {len(all_nvd_ids)} IDs de NVD.")

        db_cve_ids = set(db.execute(select(Vulnerability.cve_id)).scalars().all())

        new_cve_ids = [
            cve_id for cve_id in all_nvd_ids
            if cve_id.strip().upper() not in db_cve_ids
        ]

        total_to_import = len(new_cve_ids)
        print(f"📊 Se han detectado {total_to_import} CVEs nuevos para importar.")

        if total_to_import == 0:
            yield json.dumps({"type": "done", "imported": 0, "label": "No hay nuevos CVEs que importar."})
            print("⚠️ No hay nuevos CVEs que importar (después de la comparación de IDs).")
            return

        if total_to_import > EXCESSIVE_NEW_CVES_THRESHOLD:
            warning_message = (
                f"Se han detectado {total_to_import} CVEs nuevos, lo cual supera el umbral permitido de {EXCESSIVE_NEW_CVES_THRESHOLD}. "
                "Por favor, considera eliminar todos los registros existentes y realizar una importación completa desde cero."
            )
            yield json.dumps({"type": "warning", "message": warning_message})
            print("⚠️ IMPORTACIÓN CANCELADA: Demasiados CVEs nuevos para un incremental.")
            return

        # Fase 2: Importando los CVEs faltantes
        yield json.dumps({
            "type": "start",
            "total": total_to_import, # El total es el número de CVEs a importar en esta fase
            "label": "Importando CVEs faltantes...",
            "percentage": 0,
            "stage": "importing_cves"
        })

        external_batch_size = 10
        current_imported_cves_this_stage = 0 # Conteo para esta etapa específica
        
        for i in range(0, total_to_import, external_batch_size):
            batch_ids = new_cve_ids[i:i + external_batch_size]
            
            data_from_nvd = get_cves_by_id(batch_ids) 
            vulns_data_parsed = parse_cves_from_nvd(data_from_nvd)

            if vulns_data_parsed: 
                imported_in_batch = save_cves_to_db(db, vulns_data_parsed)
                total_imported += imported_in_batch # total_imported es el global para el final
                current_imported_cves_this_stage += imported_in_batch # Conteo para la barra de esta etapa

            current_percentage = round((current_imported_cves_this_stage / total_to_import) * 100) if total_to_import > 0 else 0
            yield json.dumps({
                "type": "progress",
                "imported": current_imported_cves_this_stage, # "Imported" para esta etapa (CVEs nuevos)
                "total": total_to_import,                     # "Total" para esta etapa (CVEs nuevos)
                "percentage": current_percentage,
                "label": f"Importando CVEs faltantes ({current_percentage}% completado)",
                "stage": "importing_cves"
            })
            await asyncio.sleep(0.001)

        yield json.dumps({"type": "done", "imported": total_imported, "label": "Importación completada."})
        
        if total_imported == total_to_import:
            print(f"✅ Proceso incremental finalizado: {total_imported} CVEs nuevos insertados.")
        elif total_imported > 0: 
            print(f"✅ Proceso incremental finalizado: {total_imported} CVEs insertados (de {total_to_import} intentados). Algunos CVEs no pudieron ser importados.")
        else: 
            print(f"⚠️ Proceso incremental finalizado: No se importaron CVEs. Posiblemente los CVEs identificados no tienen detalles públicos en NVD o hubo otros errores.")

    except Exception as e:
        err_message = f"Error durante la importación: {str(e)}"
        print(f"❌ Error: {err_message}")
        yield json.dumps({"type": "error", "message": err_message})
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

