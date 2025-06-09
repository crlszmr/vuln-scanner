import requests
from app.config.urls import NVD_API_URL
from app.config.secrets import NVD_API_KEY

HEADERS = {"apiKey": NVD_API_KEY} if NVD_API_KEY else {}

def get_cves_by_page(start_index: int = 0, results_per_page: int = 2000):
    params = {
        "startIndex": start_index,
        "resultsPerPage": results_per_page,
    }

    response = requests.get(NVD_API_URL, headers=HEADERS, params=params)
    response.raise_for_status()
    return response.json()

def get_cves_by_keyword(keyword: str, results_per_page: int = 10):
    headers = {"apiKey": NVD_API_KEY} if NVD_API_KEY else {}
    params = {
        "keywordSearch": keyword,
        "resultsPerPage": results_per_page,
    }
    response = requests.get(NVD_API_URL, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

def get_cve_details_from_nvd(cve_id: str) -> dict:
    url = f"https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={cve_id}"
    headers = {
        "apiKey": NVD_API_KEY,
        "Content-Type": "application/json"
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        vulnerabilities = data.get("vulnerabilities")
        if vulnerabilities:
            return vulnerabilities[0]
        else:
            print(f"❌ El CVE {cve_id} no fue encontrado en resultados.")
            return None
    else:
        print(f"❌ Error al traer el CVE {cve_id}: {response.status_code} {response.text}")
        return None

def get_all_cve_ids(results_per_page=2000):
    from app.services.import_status import _stop_event

    print("📞 Entrando en get_all_cve_ids()")
    url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    total = get_total_cve_count_from_nvd()
    total_pages = (total // results_per_page) + 1

    for page in range(total_pages):
        if _stop_event.is_set():
            print("🛑 Detención solicitada en get_all_cve_ids - se cancela descarga")
            break

        start_index = page * results_per_page
        print(f"🌐 Solicitando página {page + 1}/{total_pages} (startIndex={start_index})")
        params = {
            "startIndex": start_index,
            "resultsPerPage": results_per_page,
        }
        response = requests.get(url, params=params, headers=HEADERS)

        if response.status_code == 200:
            print("📥 Respuesta recibida - Status 200")
            data = response.json()
            page_ids = []
            for item in data.get("vulnerabilities", []):
                cve = item.get("cve", {})
                cve_id = cve.get("id")
                if cve_id:
                    page_ids.append(cve_id.strip().upper())
            yield page_ids
        else:
            print(f"❌ Error al solicitar CVEs: {response.status_code}")
            break


def get_cves_by_id(cve_ids: list[str]) -> dict:
    url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    all_vulnerabilities = []

    for cve_id in cve_ids:
        params = {"cveId": cve_id}
        print(f"🌐 Fetching CVE individually: {cve_id}")
        response = requests.get(url, params=params, headers=HEADERS)

        if response.status_code == 200:
            data = response.json()
            vulns = data.get("vulnerabilities", [])
            if vulns:
                all_vulnerabilities.extend(vulns)
        else:
            print(f"⚠️ Error {response.status_code} fetching {cve_id}: {response.text}")

    return {"vulnerabilities": all_vulnerabilities}




def get_total_cve_count_from_nvd() -> int:
    url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    params = {'startIndex': 0, 'resultsPerPage': 1}
    response = requests.get(url, params=params, headers=HEADERS)
    if response.status_code == 200:
        data = response.json()
        return data.get('totalResults', 0)
    return 0
