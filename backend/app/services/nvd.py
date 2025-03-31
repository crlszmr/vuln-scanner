# backend/app/services/nvd.py
import requests
from app.config.urls import NVD_API_URL
from app.config.secrets import NVD_API_KEY


HEADERS = {"apiKey": NVD_API_KEY} if NVD_API_KEY else {}

def fetch_cves_by_page(start_index: int = 0, results_per_page: int = 2000):
    params = {
        "startIndex": start_index,
        "resultsPerPage": results_per_page,
    }

    response = requests.get(NVD_API_URL, headers=HEADERS, params=params)
    response.raise_for_status()
    return response.json()


def fetch_cves_by_keyword(keyword: str, results_per_page: int = 10):
    headers = {"apiKey": NVD_API_KEY} if NVD_API_KEY else {}
    params = {
        "keywordSearch": keyword,
        "resultsPerPage": results_per_page,
    }
    response = requests.get(NVD_API_URL, headers=headers, params=params)
    response.raise_for_status()
    return response.json()