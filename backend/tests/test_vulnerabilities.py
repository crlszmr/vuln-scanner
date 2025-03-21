# backend/tests/tests_vulnerabilities.py
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, get_db
from app.models import Base, Vulnerability
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tests.conftest import *
from app.config.translations import get_message
from app.config.constants import TEST_CONSTANTS
from app.config.endpoints import ENDPOINTS

def test_create_vulnerability(client, reset_database, create_user, log_user):
    create_user()
    token = log_user(TEST_CONSTANTS["default_username"])

    response = client.post(
        ENDPOINTS["create_vulnerability"],
        json={
            "cve_id": TEST_CONSTANTS["vuln_id"],
            "description": TEST_CONSTANTS["vuln_description"],
            "severity": TEST_CONSTANTS["vuln_severity_h"],
            "reference_url": TEST_CONSTANTS["vuln_url"]
        },
        headers=token
    )
    
    assert response.status_code == 200
    assert response.json()["cve_id"] == TEST_CONSTANTS["vuln_id"]

def test_get_vulnerabilities(client, reset_database, create_user, log_user):
    create_user()
    token = log_user(TEST_CONSTANTS["default_username"])
     
    response = client.get(ENDPOINTS["create_vulnerability"], headers=token)

    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_update_vulnerability(client, reset_database, create_user, log_user):
    create_user()
    token = log_user(TEST_CONSTANTS["default_username"])

    # Crear vulnerabilidad antes de modificarla
    response = client.post(
        ENDPOINTS["create_vulnerability"],
        json={
            "cve_id": TEST_CONSTANTS["vuln_id"],
            "description": TEST_CONSTANTS["vuln_description"],
            "severity": TEST_CONSTANTS["vuln_severity_h"],
            "reference_url": TEST_CONSTANTS["vuln_url"]
        },
        headers=token
    )

    # Modificar vulnerabilidad
    response = client.put(
        ENDPOINTS["update_vulnerability"].format(id=1),
        json={"cve_id": TEST_CONSTANTS["vuln_id_2"], "description": TEST_CONSTANTS["vuln_updated_desc"], "severity": TEST_CONSTANTS["vuln_severity_l"], "reference_url": ""},
        headers=token
    )

    assert response.status_code == 200
    assert response.json()["description"] == TEST_CONSTANTS["vuln_updated_desc"]
    assert response.json()["severity"] == TEST_CONSTANTS["vuln_severity_l"]
    assert response.json()["reference_url"] == ""

def test_delete_vulnerability(client, reset_database, create_user, log_user):
    create_user()
    token = log_user(TEST_CONSTANTS["default_username"])

    # Crear vulnerabilidad antes de modificarla
    response = client.post(
        ENDPOINTS["create_vulnerability"],
        json={
            "cve_id": TEST_CONSTANTS["vuln_id"],
            "description": TEST_CONSTANTS["vuln_description"],
            "severity": TEST_CONSTANTS["vuln_severity_h"],
            "reference_url": TEST_CONSTANTS["vuln_url"]
        },
        headers=token
    )

     # Modificar vulnerabilidad
    response = client.delete(ENDPOINTS["delete_vulnerability"].format(id=1), headers=token)

    assert response.status_code == 200
    assert response.json()["message"] == get_message("vuln_deleted", "en")