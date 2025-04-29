from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.platform import PlatformCreate, PlatformResponse
from app.crud import platforms as crud_platforms

router = APIRouter(prefix="/platforms", tags=["platforms"])

@router.get("/list", response_model=list[PlatformResponse])
def list_all_platforms(db: Session = Depends(get_db)):
    return crud_platforms.list_platforms(db)
