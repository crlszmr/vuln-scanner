# backend/app/crud/platforms.py
from sqlalchemy.orm import Session
from app.models.platform import Platform
from app.schemas.platform import PlatformCreate

def get_by_uri(db: Session, cpe_uri: str):
    return db.query(Platform).filter(Platform.cpe_uri == cpe_uri).first()

def create_platform(db: Session, platform_data: PlatformCreate):
    platform_dict = platform_data.model_dump(exclude={"raw_titles", "raw_deprecated_by"})
    platform = Platform(**platform_dict)
    db.add(platform)
    db.flush()  
    db.refresh(platform)
    return platform

def list_platforms(db: Session):
    return db.query(Platform).all()
