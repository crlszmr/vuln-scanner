from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.routes.auth import get_current_user
import json
import app.crud.devices_config as crud_device_configs

router = APIRouter()

@router.post("/devices/{device_id}/upload_config", response_model=list[schemas.DeviceConfig])
def upload_device_config(
    device_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device or device.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Device not found")

    content = file.file.read()
    try:
        config_data = json.loads(content)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    created_configs = []

    # Mapeo de tipos plural -> singular para DeviceConfigCreate
    type_map = {
        "hardware": "h",
        "os": "o",
        "applications": "a"
    }

    for original_type in ["hardware", "os", "applications"]:
        entries = config_data.get(original_type, [])
        for entry in entries:
            config_create = schemas.DeviceConfigCreate(
                type=type_map[original_type],
                vendor=entry.get("vendor", ""),
                product=entry.get("product", ""),
                version=entry.get("version", None)
            )
            created = crud_device_configs.create_device_config(db=db, device_id=device_id, config=config_create)
            created_configs.append(created)

    return created_configs

@router.get("/devices/{device_id}/configs", response_model=list[schemas.DeviceConfig])
def get_device_configs(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device or device.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Device not found")

    configs = crud_device_configs.get_configs_by_device(db=db, device_id=device_id)
    return configs
