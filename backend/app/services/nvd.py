# backend/app/services/nvd.py
import requests
from app.config.urls import NVD_API_URL, NVD_CPE_URL
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

def get_cpes_by_page(start_index: int = 0, results_per_page: int = 1000):
    params = {
        "startIndex": start_index,
        "resultsPerPage": results_per_page,
    }

    response = requests.get(NVD_CPE_URL, headers=HEADERS, params=params)
    response.raise_for_status()
    return response.json()

def get_cve_details_from_nvd(cve_id: str) -> dict:
    """
    Recupera un CVE específico desde la API de NVD.
    """
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
            return vulnerabilities[0]  # Devolvemos el primer (y único) CVE encontrado
        else:
            print(f"❌ El CVE {cve_id} no fue encontrado en resultados.")
            return None
    else:
        print(f"❌ Error al traer el CVE {cve_id}: {response.status_code} {response.text}")
        return None