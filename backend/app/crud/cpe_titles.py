# backend/app/crud/cpe_titles.py
from sqlalchemy.orm import Session
from app.models.cpe_title import CpeTitle
from app.schemas.cpe_title import CpeTitleCreate

def create_multi(db: Session, titles: list[CpeTitleCreate]) -> None:
    db_titles = [CpeTitle(**title.dict()) for title in titles]
    db.add_all(db_titles)
    db.commit()