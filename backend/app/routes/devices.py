from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.database import get_db
from app.routes.auth import get_current_user
import json
import app.crud.devices_config as crud_device_configs

router = APIRouter()

@router.post("/devices", response_model=schemas.Device)
def create_device_with_config(
    alias: str = Form(...),
    type: str = Form(...),
    os_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # 1️⃣ Crear el dispositivo
    device_create = schemas.DeviceCreate(
        alias=alias,
        type=type,
        os_name=os_name
    )
    device = crud.devices.create_device(db=db, obj_in=device_create, user_id=current_user.id)

    # 2️⃣ Procesar el fichero system_config.json
    content = file.file.read()
    try:
        config_data = json.loads(content)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid system_config.json")

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
            crud_device_configs.create_device_config(db=db, device_id=device.id, config=config_create)

    return device
