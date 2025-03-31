# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, vulnerabilities, nvd
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="API de Identificación de Vulnerabilidades", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vulnerabilities.router)
app.include_router(nvd.router)

@app.get("/")
def read_root():
    return {"message": "API en ejecución"}