# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, vulnerabilities, nvd, devices, devices_config
from app.models import device
from app.database import engine, Base
from app.models import device_config
import logging
from rich.logging import RichHandler



Base.metadata.create_all(bind=engine)

app = FastAPI(title="API de Identificación de Vulnerabilidades", version="1.0")

# Configurar logging global → muy importante
logging.basicConfig(
    level=logging.INFO,  # Mostrar INFO y superior
    format="%(message)s",  # Solo mostrar el mensaje sin tonterías
    datefmt="[%X]",
    handlers=[RichHandler()]  # Mostrar bonito en consola
)

logger = logging.getLogger(__name__)
logger.info("🚀 Iniciando aplicación...")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 👉 tu frontend
    allow_credentials=True,  # 👈 muy importante para cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vulnerabilities.router)
app.include_router(nvd.router)
app.include_router(devices.router)
app.include_router(devices_config.router)

@app.get("/")
def read_root():
    return {"message": "API en ejecución"}

logger.info("✅ Aplicación iniciada correctamente.")
