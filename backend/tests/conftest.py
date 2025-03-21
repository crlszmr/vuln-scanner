# backend/tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, close_all_sessions
from app.database import Base, get_db
from app.main import app
from fastapi.testclient import TestClient
import os
from app.config.translations import get_message
from app.config.constants import TEST_CONSTANTS
from app.config.endpoints import ENDPOINTS



# Base de datos de pruebas en archivo físico para persistencia
TEST_DATABASE_URL = TEST_CONSTANTS["test_db_url"]
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Crea y limpia BD por cada sesión de test
@pytest.fixture(scope="session")
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    close_all_sessions()
    engine.dispose()
    Base.metadata.drop_all(bind=engine)
    try:
        os.remove("./test.db")
    except PermissionError:
        print(get_message("remove_test_db", "en"))

# Resetea BD
@pytest.fixture(scope="function")
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

# Crea una nueva sesión de base de datos para cada test
@pytest.fixture(scope="function")
def db_session(setup_database):
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Configura TestClient para ejecutar peticiones en los tests
@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session  # Cada test usa una sesión independiente
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db

    return TestClient(app)

# Crea un usuario de prueba y devuelve su username, email, y password
@pytest.fixture
def create_user(client):
    def _create(username=TEST_CONSTANTS["default_username"], email=TEST_CONSTANTS["default_email"], password=TEST_CONSTANTS["default_password"]):
        response = client.post(
            ENDPOINTS["register"],
            json={"username": username, "email": email, "password": password}
        )
        assert response.status_code in [200, 201], f"{get_message('error_create_user', 'en')}: {response.text}"
        return {"username": username, "email": email, "password": password}
    
    return _create

# Logea usuario por defecto. Asegurarse de que exista antes
@pytest.fixture
def log_user(client):
    def _log(username=TEST_CONSTANTS["default_username"], password=TEST_CONSTANTS["default_password"]):
        login_response = client.post(
            ENDPOINTS["login"],
            data={"username": username, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        assert login_response.status_code == 200, f"{get_message('remove_test_db', 'en')}: {login_response.text}"
        token = login_response.json().get("access_token")
        assert token, get_message("no_token", "en")
        return {"Authorization": f"Bearer {token}"}

    return _log