# backend/app/__init__.py
from fastapi import FastAPI
from . import database, models, schemas  

app = FastAPI()