from .imports import *

def download_weakness_xml_if_needed():
    os.makedirs('data', exist_ok=True)
    if os.path.exists(CWE_XML_PATH):
        print('📄 CWE XML ya existe. No se descarga.')
        return
    print('⬇️ Descargando CWE XML desde MITRE...')
    response = requests.get(CWE_XML_URL)
    if response.status_code != 200:
        raise Exception(f'❌ Error al descargar el XML: {response.status_code}')
    with open(CWE_ZIP_PATH, 'wb') as f:
        f.write(response.content)
    import zipfile
    with zipfile.ZipFile(CWE_ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall('data')
    os.remove(CWE_ZIP_PATH)
    print('✅ CWE XML descargado y extraído.')

def import_all_weaknesses_from_file(filepath: str, db, limit: int=None) -> int:
    tree = ET.parse(filepath)
    root = tree.getroot()
    namespace = {'cwe': 'http://cwe.mitre.org/cwe-7'}
    weaknesses = []
    for elem in root.findall('.//cwe:Weakness', namespace):
        try:
            weaknesses.append(WeaknessCreate(id=int(elem.attrib.get('ID')), name=elem.attrib.get('Name', ''), abstraction=elem.attrib.get('Abstraction'), structure=elem.attrib.get('Structure'), status=elem.attrib.get('Status'), description=extract_text(elem.find('cwe:Description', namespace)), extended_description=extract_text(elem.find('cwe:Extended_Description', namespace)), background_details=extract_text(elem.find('cwe:Background_Details', namespace)), modes_of_introduction=serialize_blocks(elem, 'cwe:Modes_Of_Introduction/cwe:Intro', namespace, ('Phase',), ('Note',)), applicable_platforms=serialize_elements(elem, 'cwe:Applicable_Platforms/*', namespace), alternate_terms=extract_multiple_as_json(elem.find('cwe:Alternate_Terms', namespace), 'cwe:Term', namespace), potential_mitigations=serialize_blocks(elem, 'cwe:Potential_Mitigations/cwe:Mitigation', namespace, ('Phase',), ('Description',)), consequences=serialize_blocks(elem, 'cwe:Consequences/cwe:Consequence', namespace, (), ('Scope', 'Impact')), demonstrative_examples=serialize_blocks(elem, 'cwe:Demonstrative_Examples/cwe:Example', namespace, (), ('Intro_Text', 'Body_Text')), observed_examples=serialize_elements(elem.find('cwe:Observed_Examples', namespace), 'cwe:Observed_Example', namespace), taxonomy_mappings=serialize_blocks(elem, 'cwe:Taxonomy_Mappings/cwe:Taxonomy_Mapping', namespace, ('Taxonomy_Name', 'Entry_ID', 'Entry_Name'), ()), relationships=serialize_blocks(elem, 'cwe:Relationships/cwe:Relationship', namespace, ('Relationship_Type', 'Target_CWE_ID', 'Target_CWE_Name'), ())))
        except Exception:
            continue
    if limit is not None:
        weaknesses = weaknesses[:limit]
    crud_weaknesses.create_multi(db, weaknesses)
    db.commit()
    return len(weaknesses)