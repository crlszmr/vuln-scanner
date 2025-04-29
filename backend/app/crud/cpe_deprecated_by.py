# backend/app/crud/cpe_deprecated_by.py
from sqlalchemy.orm import Session
from app.models.cpe_deprecated_by import CpeDeprecatedBy
from app.schemas.cpe_deprecated_by import CpeDeprecatedByCreate

def create_multi(db: Session, entries: list[CpeDeprecatedByCreate]):
    db.add_all([CpeDeprecatedBy(**entry.dict()) for entry in entries])
    db.flush()  # Puedes usar commit si lo deseas aquí, aunque mejor hacerlo fuera

