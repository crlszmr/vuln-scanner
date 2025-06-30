import os
import gzip
import shutil
import json

def extract_cvss_data_from_feed(metrics: dict) -> dict:
    try:
        if 'baseMetricV3' in metrics and isinstance(metrics['baseMetricV3'], dict):
            cvss_data = metrics['baseMetricV3'].get('cvssV3', {})
            if isinstance(cvss_data, dict):
                return {
                    'score': str(cvss_data.get('baseScore')),
                    'vector': cvss_data.get('vectorString'),
                    'severity': cvss_data.get('baseSeverity'),
                    'cvss_version': '3.x',
                    'exploitability_score': metrics['baseMetricV3'].get('exploitabilityScore'),
                    'impact_score': metrics['baseMetricV3'].get('impactScore'),
                    'user_interaction_required': None,
                    'obtain_all_privileges': None,
                    'obtain_user_privileges': None,
                    'obtain_other_privileges': None,
                    'attack_vector': cvss_data.get('attackVector'),
                    'attack_complexity': cvss_data.get('attackComplexity'),
                    'privileges_required': cvss_data.get('privilegesRequired'),
                    'user_interaction': cvss_data.get('userInteraction'),
                    'scope': cvss_data.get('scope'),
                    'confidentiality_impact': cvss_data.get('confidentialityImpact'),
                    'integrity_impact': cvss_data.get('integrityImpact'),
                    'availability_impact': cvss_data.get('availabilityImpact'),
                    'access_vector': None,
                    'access_complexity': None,
                    'authentication': None
                }
        if 'baseMetricV2' in metrics and isinstance(metrics['baseMetricV2'], dict):
            cvss_data = metrics['baseMetricV2'].get('cvssV2', {})
            if isinstance(cvss_data, dict):
                return {
                    'score': str(cvss_data.get('baseScore')),
                    'vector': cvss_data.get('vectorString'),
                    'severity': metrics['baseMetricV2'].get('severity'),
                    'cvss_version': '2.0',
                    'exploitability_score': metrics['baseMetricV2'].get('exploitabilityScore'),
                    'impact_score': metrics['baseMetricV2'].get('impactScore'),
                    'user_interaction_required': metrics['baseMetricV2'].get('userInteractionRequired'),
                    'obtain_all_privileges': metrics['baseMetricV2'].get('obtainAllPrivilege'),
                    'obtain_user_privileges': metrics['baseMetricV2'].get('obtainUserPrivilege'),
                    'obtain_other_privileges': metrics['baseMetricV2'].get('obtainOtherPrivilege'),
                    'attack_vector': cvss_data.get('accessVector'),
                    'attack_complexity': cvss_data.get('accessComplexity'),
                    'privileges_required': None,
                    'user_interaction': None,
                    'scope': None,
                    'confidentiality_impact': cvss_data.get('confidentialityImpact'),
                    'integrity_impact': cvss_data.get('integrityImpact'),
                    'availability_impact': cvss_data.get('availabilityImpact'),
                    'access_vector': cvss_data.get('accessVector'),
                    'access_complexity': cvss_data.get('accessComplexity'),
                    'authentication': cvss_data.get('authentication')
                }
    except Exception as e:
        print(f'⚠️ Error en extract_cvss_data_from_feed: {type(e).__name__}: {e}')
        return {}
    return {}

def extract_cvss_data(metrics: dict) -> dict:
    for key, version in [('cvssMetricV31', '3.1'), ('cvssMetricV30', '3.0'), ('cvssMetricV2', '2.0')]:
        entries = metrics.get(key)
        if entries and isinstance(entries, list):
            for entry in entries:
                cvss_data = entry.get('cvssData', {})
                if cvss_data:
                    return {
                        'score': str(cvss_data.get('baseScore')),
                        'vector': cvss_data.get('vectorString'),
                        'severity': cvss_data.get('baseSeverity'),
                        'cvss_version': version,
                        'exploitability_score': entry.get('exploitabilityScore'),
                        'impact_score': entry.get('impactScore'),
                        'user_interaction_required': entry.get('userInteractionRequired'),
                        'obtain_all_privileges': entry.get('obtainAllPrivilege'),
                        'obtain_user_privileges': entry.get('obtainUserPrivilege'),
                        'obtain_other_privileges': entry.get('obtainOtherPrivilege'),
                        'attack_vector': cvss_data.get('attackVector'),
                        'attack_complexity': cvss_data.get('attackComplexity'),
                        'privileges_required': cvss_data.get('privilegesRequired'),
                        'user_interaction': cvss_data.get('userInteraction'),
                        'scope': cvss_data.get('scope'),
                        'confidentiality_impact': cvss_data.get('confidentialityImpact'),
                        'integrity_impact': cvss_data.get('integrityImpact'),
                        'availability_impact': cvss_data.get('availabilityImpact'),
                        'access_vector': cvss_data.get('accessVector'),
                        'access_complexity': cvss_data.get('accessComplexity'),
                        'authentication': cvss_data.get('authentication')
                    }
    return {}

def extract_text(element):
    return element.text.strip() if element is not None and element.text else None

def serialize_blocks(parent, path, namespace, attribs=(), text_fields=()):
    if parent is None:
        return []

    result = []
    for elem in parent.findall(path, namespace):
        block = {}
        for attr in attribs:
            val = elem.attrib.get(attr)
            if val:
                block[attr] = val
        for tf in text_fields:
            sub = elem.find(f"cwe:{tf}", namespace)
            if sub is not None and sub.text and sub.text.strip():
                block[tf] = sub.text.strip()
        if block:
            result.append(block)
    return result



def serialize_elements(parent, path, namespace):
    if parent is None:
        return []

    elements = []
    for child in parent.findall(path, namespace):
        tag = child.tag.split('}')[-1]
        if child.text and child.text.strip():
            elements.append({tag: child.text.strip()})
    return elements



def extract_multiple_as_list(parent, tag, namespace):
    if parent is None:
        return []
    result = []
    for e in parent.findall(tag, namespace):
        if e.text and e.text.strip():
            result.append({"value": e.text.strip()})
    return result




def decompress_once(filepath: str) -> str:
    print(f"🔍 decompress_once() llamada con: {filepath}")
    json_path = filepath[:-3]  # quita '.gz'
    print(f"📁 Ruta destino JSON: {json_path}")
    print(f"🔎 ¿Existe JSON?: {os.path.exists(json_path)}")

    if not os.path.exists(json_path):
        print(f"🗃️ Descomprimiendo {filepath} → {json_path}")
        with gzip.open(filepath, 'rb') as f_in:
            with open(json_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
    return json_path