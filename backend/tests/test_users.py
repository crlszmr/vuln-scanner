# backend/tests/tests_users.py
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, get_db
from app.models import Base, Vulnerability
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tests.conftest import *
from app.config.translations import get_message
from app.config.constants import TEST_CONSTANTS
from app.config.endpoints import *


def test_register_user(client, db_session, reset_database):
    response = client.post(
        AUTH_BASE+REGISTER,
        json={"username": TEST_CONSTANTS["default_username"], "email": TEST_CONSTANTS["default_email"], "password": TEST_CONSTANTS["default_password"]}
    )

    assert response.status_code == 200
    assert response.json()["message"] == get_message("user_created", "en")

def test_register_duplicate_username(client, db_session, reset_database, create_user):
    create_user()
    response = client.post(
        AUTH_BASE+REGISTER,
        json={"username": TEST_CONSTANTS["default_username"], "email": TEST_CONSTANTS["default_email_2"], "password": TEST_CONSTANTS["default_password"]}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == get_message("username_taken", "en")

def test_register_duplicate_email(client, db_session, reset_database, create_user):
    create_user()
    response = client.post(
        AUTH_BASE+REGISTER,
        json={"username": TEST_CONSTANTS["default_username_2"], "email": TEST_CONSTANTS["default_email"], "password": TEST_CONSTANTS["default_password"]}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == get_message("email_taken", "en")


def test_login_user(client, db_session, log_user, reset_database, create_user):
    create_user() # Crea usuario para luego logearlo
    response = client.post(
        AUTH_BASE+LOGIN,
        data={"username": TEST_CONSTANTS["default_username"], "password": TEST_CONSTANTS["default_password"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_update_user(client, db_session, reset_database, create_user, log_user):
    create_user() # Crea usuario para luego actualizarlo
    token = log_user(TEST_CONSTANTS["default_username"]) #Logea usuario
    response = client.put(
        AUTH_BASE+UPDATE_USER.format(username=TEST_CONSTANTS["default_username"]),
        json={"username": TEST_CONSTANTS["new_username"], "email": TEST_CONSTANTS["new_email"], "password": TEST_CONSTANTS["new_password"]},
        headers=token
    )
    
    assert response.status_code == 200
    assert response.json()["message"] == get_message("user_updated", "en")

def test_update_duplicate_username(client, db_session):
    client.post(
        AUTH_BASE+REGISTER,
        json={"username": TEST_CONSTANTS["default_username_1"], "email": TEST_CONSTANTS["default_email_1"], "password": TEST_CONSTANTS["default_password"]}
    )
    client.post(
        AUTH_BASE+REGISTER,
        json={"username": TEST_CONSTANTS["default_username_2"], "email": TEST_CONSTANTS["default_email_2"], "password": TEST_CONSTANTS["default_password"]}
    )
    login_response = client.post(
        AUTH_BASE+LOGIN,
        data={"username": TEST_CONSTANTS["default_username_1"], "password": TEST_CONSTANTS["default_password"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = login_response.json()["access_token"]
    response = client.put(
       AUTH_BASE+UPDATE_USER.format(username=TEST_CONSTANTS["default_username_1"]),
        json={"username": TEST_CONSTANTS["default_username_2"]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == get_message("username_taken", "en")

def test_update_duplicate_email(client, db_session):
    client.post(
        AUTH_BASE+REGISTER,
        json={"username": TEST_CONSTANTS["default_username_1"], "email": TEST_CONSTANTS["default_email_1"], "password": TEST_CONSTANTS["default_password"]}
    )
    client.post(
        AUTH_BASE+REGISTER,
        json={"username": TEST_CONSTANTS["default_username_2"], "email": TEST_CONSTANTS["default_email_2"], "password": TEST_CONSTANTS["default_password"]}
    )
    login_response = client.post(
        AUTH_BASE+LOGIN,
        data={"username": TEST_CONSTANTS["default_username_1"], "password": TEST_CONSTANTS["default_password"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = login_response.json()["access_token"]
    response = client.put(
        AUTH_BASE+UPDATE_USER.format(username=TEST_CONSTANTS["default_username_1"]),
        json={"email": TEST_CONSTANTS["default_email_2"]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == get_message("email_taken", "en")

def test_delete_user(client, db_session, create_user, log_user):
    create_user()
    token = log_user(TEST_CONSTANTS["default_username"])
    response = client.delete(AUTH_BASE+DELETE_USER.format(username=TEST_CONSTANTS["default_username"]), headers=token)
    assert response.status_code == 200
    assert response.json()["message"] == get_message("user_deleted", "en")