# cwe_importer.py

from .imports import *
import os
import json
import gzip
from datetime import datetime
from app.services import import_status_cwe
from app.database import SessionLocal
from app.schemas.weakness import WeaknessCreate
from app.crud import weaknesses as crud_weaknesses
import logging
import xmltodict
import xml.etree.ElementTree as ET
from pydantic import ValidationError




logger = logging.getLogger(__name__)

CWE_XML_URL = "https://cwe.mitre.org/data/xml/cwec_v4.17.xml.zip"
CWE_ZIP_PATH = "data/cwec_v4.17.xml.zip"
CWE_XML_PATH = "data/cwec_v4.17.xml"


def download_cwe_xml_if_needed():
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
    with zipfile.ZipFile(CWE_ZIP_PATH, "r") as zip_ref:
        zip_ref.extractall("data")
    os.remove(CWE_ZIP_PATH)
    print("✅ CWE XML descargado y extraído.")



def extract_weaknesses_from_xml(filepath: str):
    import xml.etree.ElementTree as ET
    tree = ET.parse(filepath)
    root = tree.getroot()
    namespace = {'cwe': 'http://cwe.mitre.org/cwe-7'}

    weaknesses = []

    for elem in root.findall('.//cwe:Weakness', namespace):
        try:
            cwe_id = elem.attrib.get("ID")
            if not cwe_id:
                continue

            # DEBUG: Verificar rutas individuales
            if cwe_id == "1004":
                print(f"\n📌 DEBUG CWE-{cwe_id}")
                print("  ├── Description:", extract_text(elem.find('cwe:Description', namespace)))
                print("  ├── Extended_Description:", extract_text(elem.find('cwe:Extended_Description', namespace)))
                print("  ├── Background_Details:", extract_text(elem.find('cwe:Background_Details', namespace)))

                print("  ├── Modes_Of_Introduction element:", elem.find('cwe:Modes_Of_Introduction', namespace))
                print("  ├── Intro count:", len(elem.findall('cwe:Modes_Of_Introduction/cwe:Introduction', namespace)))
                print("  ├── serialize_blocks Intro:", serialize_blocks(elem, 'cwe:Modes_Of_Introduction/cwe:Introduction', namespace, ('Phase',), ('Note',)))

                print("  ├── Potential_Mitigations:", serialize_blocks(elem, 'cwe:Potential_Mitigations/cwe:Mitigation', namespace, ('Phase',), ('Description',)))
                print("  ├── Alternate_Terms:", extract_multiple_as_list(elem.find('cwe:Alternate_Terms', namespace), 'cwe:Term', namespace))
                print("  ├── Consequences:", serialize_blocks(elem, 'cwe:Common_Consequences/cwe:Consequence', namespace, (), ('Scope', 'Impact')))

                print("  ├── Demonstrative_Examples raw:", ET.tostring(elem.find('cwe:Demonstrative_Examples', namespace), encoding='unicode'))
                print("  ├── Demonstrative_Examples parsed:", serialize_blocks(elem, 'cwe:Demonstrative_Examples/cwe:Example', namespace, (), ('Intro_Text', 'Body_Text')))

                print("  ├── Observed_Examples raw:", ET.tostring(elem.find('cwe:Observed_Examples', namespace), encoding='unicode'))
                print("  ├── Observed_Examples parsed:", serialize_elements(elem.find('cwe:Observed_Examples', namespace), 'cwe:Observed_Example', namespace))

                print("  ├── Relationships raw:", ET.tostring(elem.find('cwe:Relationships', namespace), encoding='unicode'))
                print("  ├── Relationships parsed:", serialize_blocks(elem, 'cwe:Relationships/cwe:Relationship', namespace, ('Relationship_Type', 'Target_CWE_ID', 'Target_CWE_Name'), ()))

                print("  └── Taxonomy_Mappings parsed:", serialize_blocks(elem, 'cwe:Taxonomy_Mappings/cwe:Taxonomy_Mapping', namespace, ('Taxonomy_Name', 'Entry_ID', 'Entry_Name'), ()))

            weakness = WeaknessCreate(
                id=int(cwe_id),
                name=elem.attrib.get("Name", ""),
                abstraction=elem.attrib.get("Abstraction"),
                structure=elem.attrib.get("Structure"),
                status=elem.attrib.get("Status"),
                description=extract_text(elem.find('cwe:Description', namespace)),
                extended_description=extract_text(elem.find('cwe:Extended_Description', namespace)),
                background_details=extract_text(elem.find('cwe:Background_Details', namespace)),
                modes_of_introduction=serialize_blocks(elem, 'cwe:Modes_Of_Introduction/cwe:Introduction', namespace, ('Phase',), ('Note',)),
                applicable_platforms=serialize_elements(elem, 'cwe:Applicable_Platforms/*', namespace),
                alternate_terms = extract_multiple_as_list(elem.find('cwe:Alternate_Terms', namespace), 'cwe:Term', namespace),
                potential_mitigations=serialize_blocks(elem, 'cwe:Potential_Mitigations/cwe:Mitigation', namespace, ('Phase',), ('Description',)),
                consequences=serialize_blocks(elem, 'cwe:Common_Consequences/cwe:Consequence', namespace, (), ('Scope', 'Impact')),
                demonstrative_examples=serialize_blocks(elem, 'cwe:Demonstrative_Examples/cwe:Example', namespace, (), ('Intro_Text', 'Body_Text')),
                observed_examples=serialize_elements(elem.find('cwe:Observed_Examples', namespace), 'cwe:Observed_Example', namespace),
                taxonomy_mappings=serialize_blocks(elem, 'cwe:Taxonomy_Mappings/cwe:Taxonomy_Mapping', namespace, ('Taxonomy_Name', 'Entry_ID', 'Entry_Name'), ()),
                relationships=serialize_blocks(elem, 'cwe:Relationships/cwe:Relationship', namespace, ('Relationship_Type', 'Target_CWE_ID', 'Target_CWE_Name'), ())
            )

            weaknesses.append(weakness)

        except ValidationError as e:
            print(f"❌ CWE {cwe_id} inválido → {e.errors()}")
        except Exception as e:
            print(f"💥 Error inesperado en CWE {cwe_id}: {type(e).__name__} - {e}")

    return weaknesses





def miles(n):
    return f"{n:,}".replace(",", ".")


async def import_all_cwes_stream():
    try:
        print("[CWE IMPORT] 🟢 Paso 1: Spinner y mensaje de conexión")
        import_status_cwe.start(resource="cwe", label="cwe.connecting_mitre")

        print("[CWE IMPORT] 🟢 Paso 2: Descargando XML...")
        await import_status_cwe.publish({"label": "cwe.downloading_xml"})
        download_cwe_xml_if_needed()
        await import_status_cwe.publish({"label": "cwe.xml_checked"})

        print("[CWE IMPORT] 🟡 Parseando XML...")
        await import_status_cwe.publish({"label": "cwe.parsing_xml"})
        weaknesses = extract_weaknesses_from_xml(CWE_XML_PATH)
        await import_status_cwe.publish({
            "label": "cwe.parsing_completed",
            "count": miles(len(weaknesses))
        })

        print("[CWE IMPORT] 🟢 Parseo completado. Total: ", len(weaknesses))

        TOTAL_TO_INSERT = len(weaknesses)
        BATCH_SIZE = 1000
        imported_total = 0

        db = SessionLocal()

        async def send_progress():
            percent = int(imported_total / TOTAL_TO_INSERT * 100) if TOTAL_TO_INSERT else 100
            await import_status_cwe.publish({
                "type": "start_inserting",
                "imported": imported_total,
                "total_to_insert": TOTAL_TO_INSERT,
                "percentage": percent,
                "label": "cwe.inserting_items"
            })

        await import_status_cwe.publish({
            "type": "start_inserting",
            "label": "cwe.inserting_items",
            "total_to_insert": TOTAL_TO_INSERT,
            "imported": 0,
            "percentage": 0,
        })

        print("[CWE IMPORT] 🟡 Insertando CWEs...")
        for i in range(0, TOTAL_TO_INSERT, BATCH_SIZE):
            batch = weaknesses[i:i + BATCH_SIZE]
            crud_weaknesses.create_multi(db, batch)
            db.commit()
            imported_total += len(batch)
            await send_progress()

        db.close()
        print("[CWE IMPORT] 🟢 Importación completada.")
        import_status_cwe.finish(resource="cwe", imported=imported_total, total=TOTAL_TO_INSERT, label="cwe.import_completed")

    except Exception as e:
        print(f"[CWE IMPORT] ❌ Error: {str(e)}")
        import_status_cwe.fail(resource="cwe", message=f"Error durante la importación: {str(e)}")
