from .imports import *
import os
import requests
import gzip
import xml.etree.ElementTree as ET
import time
from app.services import import_status_cpe
import asyncio
from datetime import datetime


from app.database import SessionLocal
from app.crud import platforms as crud_platforms
from app.crud import cpe_titles as crud_titles
from app.crud import cpe_references as crud_references
from app.crud import cpe_deprecated_by as crud_deprecated
from app.models.platform import Platform
from app.schemas.cpe_deprecated_by import CpeDeprecatedByCreate
from app.schemas.cpe_reference import CPEReferenceCreate
from app.schemas.cpe_title import CpeTitleCreate
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime
import xml.etree.ElementTree as ET

import logging

logger = logging.getLogger(__name__)

CPE_XML_URL = "https://nvd.nist.gov/feeds/xml/cpe/dictionary/official-cpe-dictionary_v2.3.xml.gz"
CPE_XML_GZ_PATH = "data/official-cpe-dictionary_v2.3.xml.gz"
CPE_XML_PATH = "data/official-cpe-dictionary_v2.3.xml"


def parse_cpe_uri(uri: str) -> tuple[str, str, str]:
    try:
        parts = uri.split(":")
        if len(parts) >= 6:
            vendor, product, version = parts[3], parts[4], parts[5]
            return vendor, product, version
        else:
            print(f"⚠️ URI incompleto: {uri}")
    except Exception as e:
        print(f"❌ Error parseando CPE URI: {uri} — {e}")
    return "", "", ""



def extract_cpes_from_feed_config(config: dict) -> list[str]:
    cpes = []
    nodes = config.get('nodes', [])
    for node in nodes:
        cpes.extend(extract_cpes_from_node(node))
    return cpes


def extract_cpes_from_node(node: dict) -> list[str]:
    cpes = []
    for match in node.get('cpe_match', []):
        if isinstance(match, dict) and match.get('vulnerable', False):
            cpe_uri = match.get('cpe23Uri') or match.get('criteria')
            if cpe_uri:
                cpes.append(cpe_uri)
    for child in node.get('children', []):
        cpes.extend(extract_cpes_from_node(child))
    return cpes


def download_cpe_xml_if_needed():
    from datetime import datetime
    import os
    import requests
    import gzip

    def log(msg):
        print(f"[CPE XML] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} {msg}")

    os.makedirs('data', exist_ok=True)
    last_modified_local = None

    log("Comprobando existencia de archivo XML local...")
    if os.path.exists(CPE_XML_PATH):
        last_modified_timestamp = os.path.getmtime(CPE_XML_PATH)
        last_modified_local = datetime.utcfromtimestamp(last_modified_timestamp).strftime('%a, %d %b %Y %H:%M:%S GMT')
        log('📄 Archivo XML local ya existe. Comprobando si hay versión nueva en NVD...')
    else:
        log("No existe archivo XML local. Se descargará por primera vez.")

    headers = {}
    if last_modified_local:
        headers['If-Modified-Since'] = last_modified_local

    log(f"Realizando petición HTTP a {CPE_XML_URL} con If-Modified-Since: {headers.get('If-Modified-Since', 'NO')}")
    response = requests.get(CPE_XML_URL, headers=headers)

    if response.status_code == 304:
        log('✅ No hay versión nueva del CPE XML en NVD. No se descarga de nuevo.')
        return

    if response.status_code != 200:
        log(f"❌ Error HTTP al descargar el XML de CPE: {response.status_code}")
        raise Exception(f'❌ Error al descargar el XML de CPE: {response.status_code}')

    log('Descarga completada. Guardando archivo .gz temporal...')
    with open(CPE_XML_GZ_PATH, 'wb') as f:
        f.write(response.content)

    log('📦 Descomprimiendo archivo .gz...')
    with gzip.open(CPE_XML_GZ_PATH, 'rb') as f_in:
        with open(CPE_XML_PATH, 'wb') as f_out:
            f_out.write(f_in.read())
    os.remove(CPE_XML_GZ_PATH)
    log('✅ Nueva versión de CPE XML descargada, descomprimida y lista para usar.')


async def import_cpes_from_xml(filepath: str = CPE_XML_PATH) -> int:
    print("🚀 Iniciando importación de CPEs...")
    download_cpe_xml_if_needed()

    print("📥 Parseando XML...")
    tree = ET.parse(filepath)
    root = tree.getroot()
    ns = {
        'cpe-23': 'http://scap.nist.gov/schema/cpe-extension/2.3',
        'cpe-lang': 'http://cpe.mitre.org/dictionary/2.0'
    }

    db = SessionLocal()
    imported = 0

    try:
        print("📋 Obteniendo URIs ya existentes en BD...")
        existing_cpes = set((p.cpe_uri for p in crud_platforms.get_all_uris(db)))

        platforms_to_insert = []
        titles_to_insert = []
        references_to_insert = []
        deprecated_by_to_insert = []

        print("🔍 Buscando cpe-items en XML...")
        items = root.findall('.//{*}cpe-item')
        total = len(items)
        print(f'📦 Total CPEs en XML: {total}')

        print("🛠️ Fase 1: Extrayendo plataformas nuevas...")
        for idx, item in enumerate(items, start=1):
            if idx % 10000 == 0:
                print(f"  🔸 Analizados {idx}/{total} cpe-items...")

            cpe_23 = item.find('cpe-23:cpe23-item', ns)
            if cpe_23 is None:
                continue
            cpe_name = cpe_23.attrib.get('name')
            if not cpe_name or not cpe_name.startswith('cpe:2.3:'):
                continue
            if cpe_name not in existing_cpes:
                vendor, product, version = parse_cpe_uri(cpe_name)
                platforms_to_insert.append({
                    'cpe_uri': cpe_name,
                    'vendor': vendor,
                    'product': product,
                    'version': version,
                    'deprecated': item.attrib.get('deprecated', 'false') == 'true'
                })

        print(f"📨 Plataformas a insertar: {len(platforms_to_insert)}")
        if platforms_to_insert:
            print("📥 Insertando plataformas en BD por bloques...")
            batch_size = 1000
            inserted_count = 0
            total = len(platforms_to_insert)

            for i in range(0, total, batch_size):
                batch = platforms_to_insert[i:i+batch_size]
                stmt = insert(Platform).values(batch)
                stmt = stmt.on_conflict_do_nothing(index_elements=['cpe_uri'])
                result = db.execute(stmt)
                db.commit()

                inserted_now = result.rowcount or len(batch)
                inserted_count += inserted_now


                print(f"🧩 Insertadas {inserted_count}/{total} plataformas...")

            imported = inserted_count
            print(f'✅ Plataformas insertadas: {imported}')


        print("📌 Cargando todas las plataformas para mapear IDs...")
        all_platforms = db.query(Platform).all()
        platforms_by_uri = {p.cpe_uri: p.id for p in all_platforms}
        print(f'📚 Total plataformas en BD: {len(platforms_by_uri)}')

        print("🛠️ Fase 2: Extrayendo titles, references y deprecated-by...")
        for idx, item in enumerate(items, start=1):
            if idx % 100 == 0:
                print(f"🧩 Procesando entrada {idx} de {total}")
            if idx % 1000 == 0 or idx == total:
                print(f"🔄 Procesando CPEs {idx - 999} a {idx} de {total}...")


            cpe_23 = item.find('cpe-23:cpe23-item', ns)
            if cpe_23 is None:
                continue
            cpe_name = cpe_23.attrib.get('name')
            if not cpe_name or not cpe_name.startswith('cpe:2.3:'):
                continue

            platform_id = platforms_by_uri.get(cpe_name)
            if platform_id is None:
                logger.warning(f'❗ No se encontró platform_id para {cpe_name}')
                continue

            for t in item.findall('cpe-lang:title', ns):
                lang = t.attrib.get('{http://www.w3.org/XML/1998/namespace}lang', 'en')
                value = t.text or ''
                titles_to_insert.append(CpeTitleCreate(platform_id=platform_id, lang=lang, value=value))

            refs_parent = item.find('cpe-lang:references', ns)
            if refs_parent is not None:
                for ref in refs_parent.findall('cpe-lang:reference', ns):
                    href = ref.attrib.get('href')
                    text = ref.text or ''
                    if not href:
                        continue
                    references_to_insert.append(CPEReferenceCreate(platform_id=platform_id, ref=href, type=text))

            deprecated = cpe_23.find('cpe-23:deprecation', ns)
            if deprecated is not None:
                for dep in deprecated.findall('cpe-23:deprecated-by', ns):
                    name = dep.attrib.get('name')
                    if not name:
                        continue
                    deprecated_by_to_insert.append(CpeDeprecatedByCreate(platform_id=platform_id, cpe_uri=name))

        print(f'📝 Titles: {len(titles_to_insert)} | 🔗 References: {len(references_to_insert)} | ⚠️ DeprecatedBy: {len(deprecated_by_to_insert)}')

        if titles_to_insert:
            print("📥 Insertando titles...")
            crud_titles.create_multi(db, titles_to_insert)

        references_valid = [r for r in references_to_insert if r.platform_id is not None]
        if references_valid:
            print("🔗 Insertando referencias...")
            crud_references.create_multi(db, references_valid)

        deprecated_valid = [d for d in deprecated_by_to_insert if d.platform_id is not None]
        if deprecated_valid:
            print("⚠️ Insertando relaciones deprecated-by...")
            crud_deprecated.create_multi(db, deprecated_valid)

        db.commit()
        print('🎉 Importación de titles, references y deprecated-by completada.')

    except Exception as e:
        logger.exception(f'❌ Error durante la importación de CPEs: {e}')
        db.rollback()
    finally:
        db.close()

    print("✅ Proceso completo de importación finalizado.")
    return imported



def extract_all_cpes(configurations: list) -> list[str]:
    cpes = []
    for config in configurations:
        nodes = config.get('nodes', [])
        collect_cpes_from_nodes(nodes, cpes)
    return cpes


def collect_cpes_from_nodes(nodes: list, cpes: list[str]):
    for node in nodes:
        for match in node.get('cpeMatch', []):
            criteria = match.get('criteria') or match.get('cpe23Uri')
            if criteria:
                cpes.append(criteria)
        for child in node.get('children', []):
            collect_cpes_from_nodes(child, cpes)

def miles(n):
    return f"{n:,}".replace(",", ".")            


async def import_all_cpes_stream():
    import os
    import xml.etree.ElementTree as ET
    from app.crud.platforms import get_all_uris
    from app.crud.cpe_titles import create_multi as create_titles_multi
    from app.crud.cpe_references import create_multi as create_refs_multi
    from app.crud.cpe_deprecated_by import create_multi as create_deprecated_multi
    from app.models.platform import Platform
    from app.schemas.cpe_deprecated_by import CpeDeprecatedByCreate
    from app.schemas.cpe_reference import CPEReferenceCreate
    from app.schemas.cpe_title import CpeTitleCreate
    from sqlalchemy.dialects.postgresql import insert

    try:
        print("[CPE IMPORT] 🟢 Paso 1: Spinner y mensaje de conexión")
        import_status_cpe.start(resource="cpe", label="cpe.connecting_nvd")

        print("[CPE IMPORT] 🟢 Paso 2: Descargando/validando XML y parseando")
        await import_status_cpe.publish({"label": "cpe.downloading_xml"})
        download_cpe_xml_if_needed()
        await import_status_cpe.publish({"label": "cpe.xml_checked"})
        print("[CPE IMPORT] 🟢 XML comprobado/descargado")

        print("[CPE IMPORT] 🟡 Parseando XML...")
        await import_status_cpe.publish({"label": "cpe.parsing_xml"})

        tree = ET.parse(CPE_XML_PATH)
        root = tree.getroot()
        items = root.findall('.//{*}cpe-item')
        await import_status_cpe.publish({
            "label": "cpe.parsing_completed",
            "count": miles(len(items))
        })
        print(f"[CPE IMPORT] 🟢 Parseo completado: {len(items)} items encontrados")

        from app.database import SessionLocal
        db = SessionLocal()
        print("[CPE IMPORT] 🟡 Obteniendo CPEs existentes en BD...")
        await import_status_cpe.publish({"label": "cpe.getting_existing"})
        existing_cpes = set([row[0] for row in get_all_uris(db)])
        print(f"[CPE IMPORT] 🟢 CPEs existentes en BD: {len(existing_cpes)}")
        if len(existing_cpes) == 0:
            print("[CPE IMPORT] 🟡 Ningún CPE detectado en la BD.")
            await import_status_cpe.publish({
                "label": "cpe.no_cpes_found"
            })
        else:
            print(f"[CPE IMPORT] 🟡 {miles(len(existing_cpes))} CPEs detectados en la BD.")
            await import_status_cpe.publish({
                "label": "cpe.existing_count",
                "count": miles(len(existing_cpes))
            })

        platforms_to_insert = []
        titles_to_insert = []
        references_to_insert = []
        deprecated_by_to_insert = []

        ns = {
            'cpe-23': 'http://scap.nist.gov/schema/cpe-extension/2.3',
            'cpe-lang': 'http://cpe.mitre.org/dictionary/2.0'
        }

        print("[CPE IMPORT] 🟡 Recorriendo items del XML (solo nuevos CPEs)...")
        for idx, item in enumerate(items, start=1):
            if idx % 100000 == 0:
                print(f"[CPE IMPORT]   ... procesados {idx}/{len(items)}")
                await import_status_cpe.publish({"label": "cpe.processing_items", "count": miles(idx), "total": miles(len(items))})
            cpe_23 = item.find('cpe-23:cpe23-item', ns)
            if cpe_23 is None:
                continue
            cpe_name = cpe_23.attrib.get('name')
            if not cpe_name or not cpe_name.startswith('cpe:2.3:'):
                continue
            if cpe_name not in existing_cpes:
                vendor, product, version = "", "", ""
                try:
                    parts = cpe_name.split(":")
                    vendor, product, version = parts[3], parts[4], parts[5]
                except Exception:
                    pass
                platforms_to_insert.append({
                    'cpe_uri': cpe_name,
                    'vendor': vendor,
                    'product': product,
                    'version': version,
                    'deprecated': item.attrib.get('deprecated', 'false') == 'true'
                })
                for t in item.findall('cpe-lang:title', ns):
                    lang = t.attrib.get('{http://www.w3.org/XML/1998/namespace}lang', 'en')
                    value = t.text or ''
                    titles_to_insert.append({'cpe_uri': cpe_name, 'lang': lang, 'value': value})
                refs_parent = item.find('cpe-lang:references', ns)
                if refs_parent is not None:
                    for ref in refs_parent.findall('cpe-lang:reference', ns):
                        href = ref.attrib.get('href')
                        text = ref.text or ''
                        if not href:
                            continue
                        references_to_insert.append({'cpe_uri': cpe_name, 'ref': href, 'type': text})
                deprecated = cpe_23.find('cpe-23:deprecation', ns)
                if deprecated is not None:
                    for dep in deprecated.findall('cpe-23:deprecated-by', ns):
                        name = dep.attrib.get('name')
                        if not name:
                            continue
                        deprecated_by_to_insert.append({'cpe_uri': cpe_name, 'cpe_uri_by': name})

        total_platforms = len(platforms_to_insert)
        total_titles = len(titles_to_insert)
        total_refs = len(references_to_insert)
        total_deprecated = len(deprecated_by_to_insert)
        TOTAL_TO_INSERT = total_platforms + total_titles + total_refs + total_deprecated

        BATCH_SIZE = 200000
        imported_total = 0
        progress_total = 0  # Acumulado de todo lo insertado

        # Nueva barra de progreso global para la inserción
        async def send_progress():
            percent = int(progress_total / TOTAL_TO_INSERT * 100) if TOTAL_TO_INSERT else 100
            await import_status_cpe.publish({
                "type": "start_inserting",
                "imported": progress_total,
                "total_to_insert": TOTAL_TO_INSERT,
                "percentage": percent,
                "label": "cpe.inserting_items"
            })

        await import_status_cpe.publish({
            "type": "start_inserting",
            "label": "cpe.inserting_items",
            "total_to_insert": TOTAL_TO_INSERT,
            "imported": 0,
            "percentage": 0,
        })

        # PLATFORMS
        print("[CPE IMPORT] 🟡 Insertando platforms en BD...")
        for i in range(0, total_platforms, BATCH_SIZE):
            batch = platforms_to_insert[i:i+BATCH_SIZE]
            stmt = insert(Platform).values(batch)
            stmt = stmt.on_conflict_do_nothing(index_elements=['cpe_uri'])
            result = db.execute(stmt)
            db.commit()
            imported_now = result.rowcount or len(batch)
            imported_total += imported_now
            progress_total += imported_now
            await send_progress()

        # Remapeo IDs (igual que antes)
        all_platforms = db.query(Platform).all()
        platforms_by_uri = {p.cpe_uri: p.id for p in all_platforms}

        # TITLES
        titles_objs = []
        for t in titles_to_insert:
            pid = platforms_by_uri.get(t['cpe_uri'])
            if pid is not None:
                titles_objs.append(CpeTitleCreate(platform_id=pid, lang=t['lang'], value=t['value']))
        print(f"[CPE IMPORT] 🟡 Insertando titles en BD ({len(titles_objs)})...")
        for i in range(0, len(titles_objs), BATCH_SIZE):
            batch = titles_objs[i:i+BATCH_SIZE]
            create_titles_multi(db, batch)
            progress_total += len(batch)
            await send_progress()

        # REFERENCES
        refs_objs = []
        for r in references_to_insert:
            pid = platforms_by_uri.get(r['cpe_uri'])
            if pid is not None:
                refs_objs.append(CPEReferenceCreate(platform_id=pid, ref=r['ref'], type=r['type']))
        print(f"[CPE IMPORT] 🟡 Insertando references en BD ({len(refs_objs)})...")
        for i in range(0, len(refs_objs), BATCH_SIZE):
            batch = refs_objs[i:i+BATCH_SIZE]
            create_refs_multi(db, batch)
            progress_total += len(batch)
            await send_progress()

        # DEPRECATED-BY
        deprecated_objs = []
        for d in deprecated_by_to_insert:
            pid = platforms_by_uri.get(d['cpe_uri'])
            if pid is not None:
                deprecated_objs.append(CpeDeprecatedByCreate(platform_id=pid, cpe_uri=d['cpe_uri_by']))
        print(f"[CPE IMPORT] 🟡 Insertando deprecated-by en BD ({len(deprecated_objs)})...")
        for i in range(0, len(deprecated_objs), BATCH_SIZE):
            batch = deprecated_objs[i:i+BATCH_SIZE]
            create_deprecated_multi(db, batch)
            progress_total += len(batch)
            await send_progress()

        db.commit()
        print("[CPE IMPORT] 🟢 Importación completada.")
        import_status_cpe.finish(resource="cpe", imported=progress_total, total=TOTAL_TO_INSERT, label="cpe.import_completed")

    except Exception as e:
        print(f"[CPE IMPORT] ❌ Error: {str(e)}")
        import_status_cpe.fail(resource="cpe", message=f"Error durante la importación: {str(e)}")
