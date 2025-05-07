# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, vulnerabilities, nvd, devices, devices_config
from app.models import device
from app.database import engine, Base
from app.models import device_config

Base.metadata.create_all(bind=engine)

app = FastAPI(title="API de Identificación de Vulnerabilidades", version="1.0")

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