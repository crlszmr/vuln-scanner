from .imports import *
import os
import requests
import gzip
import xml.etree.ElementTree as ET


def parse_cpe_uri(uri: str) -> tuple[str, str, str]:
    try:
        parts = uri.split(":")
        if len(parts) >= 6:
            return parts[3], parts[4], parts[5]
    except Exception:
        pass
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
    os.makedirs('data', exist_ok=True)
    last_modified_local = None
    if os.path.exists(CPE_XML_PATH):
        last_modified_timestamp = os.path.getmtime(CPE_XML_PATH)
        last_modified_local = datetime.utcfromtimestamp(last_modified_timestamp).strftime('%a, %d %b %Y %H:%M:%S GMT')
        print('📄 CPE XML ya existe. Comprobando si hay versión nueva...')
    headers = {}
    if last_modified_local:
        headers['If-Modified-Since'] = last_modified_local
    response = requests.get(CPE_XML_URL, headers=headers)
    if response.status_code == 304:
        print('✅ No hay versión nueva del CPE XML. No se descarga.')
        return
    if response.status_code != 200:
        raise Exception(f'❌ Error al descargar el XML de CPE: {response.status_code}')
    with open(CPE_XML_GZ_PATH, 'wb') as f:
        f.write(response.content)
    print('📦 Descomprimiendo archivo .gz...')
    with gzip.open(CPE_XML_GZ_PATH, 'rb') as f_in:
        with open(CPE_XML_PATH, 'wb') as f_out:
            f_out.write(f_in.read())
    os.remove(CPE_XML_GZ_PATH)
    print('✅ Nueva versión de CPE XML descargada, descomprimida y lista.')

def import_cpes_from_xml(filepath: str=CPE_XML_PATH) -> int:
    download_cpe_xml_if_needed()
    tree = ET.parse(filepath)
    root = tree.getroot()
    ns = {'cpe-23': 'http://scap.nist.gov/schema/cpe-extension/2.3', 'cpe-lang': 'http://cpe.mitre.org/dictionary/2.0'}
    db = SessionLocal()
    imported = 0
    try:
        existing_cpes = set((p.cpe_uri for p in crud_platforms.get_all_uris(db)))
        platforms_to_insert = []
        titles_to_insert = []
        references_to_insert = []
        deprecated_by_to_insert = []
        items = root.findall('.//{*}cpe-item')
        total = len(items)
        print(f'📦 Total CPEs en XML: {total}')
        for idx, item in enumerate(items, start=1):
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
        if platforms_to_insert:
            stmt = insert(Platform).values(platforms_to_insert)
            stmt = stmt.on_conflict_do_nothing(index_elements=['cpe_uri'])
            result = db.execute(stmt)
            db.commit()
            imported = result.rowcount or len(platforms_to_insert)
            print(f'✅ Plataformas insertadas: {imported}')
        all_platforms = db.query(Platform).all()
        platforms_by_uri = {p.cpe_uri: p.id for p in all_platforms}
        print(f'📚 Total plataformas en BD: {len(platforms_by_uri)}')
        for idx, item in enumerate(items, start=1):
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
                    dtype = dep.attrib.get('type')
                    if not name:
                        continue
                    deprecated_by_to_insert.append(CpeDeprecatedByCreate(platform_id=platform_id, cpe_uri=name))
        print(f'📝 Titles: {len(titles_to_insert)} | 🔗 References: {len(references_to_insert)} | ⚠️ DeprecatedBy: {len(deprecated_by_to_insert)}')
        if titles_to_insert:
            crud_titles.create_multi(db, titles_to_insert)
        references_valid = [r for r in references_to_insert if r.platform_id is not None]
        if references_valid:
            crud_references.create_multi(db, references_valid)
        deprecated_valid = [d for d in deprecated_by_to_insert if d.platform_id is not None]
        if deprecated_valid:
            crud_deprecated.create_multi(db, deprecated_valid)
        db.commit()
        print('🎉 Importación de titles, references y deprecated-by completada.')
    except Exception as e:
        logger.exception(f'❌ Error durante la importación de CPEs: {e}')
        db.rollback()
    finally:
        db.close()
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