from sqlalchemy.orm import Session
from app.models.cpe_deprecated_by import CpeDeprecatedBy
from app.schemas.cpe_deprecated_by import CpeDeprecatedByCreate

def create_multi(db: Session, entries: list[CpeDeprecatedByCreate]):
    db.add_all([CpeDeprecatedBy(**entry.dict()) for entry in entries])
    db.commit()  # commit aquí garantiza persistencia inmediata
