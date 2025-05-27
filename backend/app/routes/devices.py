from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.database import get_db
from app.routes.auth import get_current_user
import json
import app.crud.devices_config as crud_device_configs
from app.models.user import User
from app.services.matching_service import match_platforms_for_device
from typing import List
from app.models.device_match import DeviceMatch
from app.models.device_config import DeviceConfig
from sse_starlette.sse import EventSourceResponse
import asyncio







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

@router.get("/devices/{device_id}/match-platforms")
def match_platforms(device_id: int, db: Session = Depends(get_db)):
    results = match_platforms_for_device(device_id, db)
    if not results:
        raise HTTPException(status_code=404, detail="Device config not found for this device.")
    return results

@router.get("/devices/me", response_model=List[schemas.Device])
def read_my_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.devices.get_devices_by_user(db=db, user_id=current_user.id)

@router.get("/devices/{device_id}/config", response_model=schemas.Device)
def get_device_with_config(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = crud.devices.get_device(db=db, device_id=device_id, user_id=current_user.id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.get("/devices/{device_id}/matches")
def get_device_matches(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    matches = db.query(DeviceMatch).join(DeviceMatch.device_config).join(DeviceConfig.device).filter(
        DeviceConfig.device_id == device_id,
        DeviceConfig.device.has(user_id=current_user.id)
    ).all()

    return [
        {
            "device_config_id": m.device_config_id,
            "cve_name": m.cve_name,
            "cpe_uri": m.cpe_uri,
            "matched_vendor": m.matched_vendor,
            "matched_product": m.matched_product,
            "match_type": m.match_type,
            "match_score": m.match_score,
            "needs_review": m.needs_review,
        }
        for m in matches
    ]

@router.post("/devices/{device_id}/match-platforms/refresh")
def refresh_device_matches(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(models.Device).filter_by(id=device_id, user_id=current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    result = match_platforms_for_device(device_id, db)
    print(f"🔁 Matching ejecutado: {len(result['results'])} configs procesadas")
    return result["summary"]


@router.get("/devices/{device_id}/match-platforms/progress")
async def match_platforms_with_progress(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verificar que el dispositivo es del usuario
    device = db.query(models.Device).filter_by(id=device_id, user_id=current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    async def event_generator():
        yield {"event": "message", "data": "Iniciando análisis..."}
        await asyncio.sleep(0.5)

        result = match_platforms_for_device(device_id, db, yield_progress=True)

        # Si result es un generador de progreso
        async for progreso in result:
            yield {"event": "message", "data": progreso}

        yield {"event": "message", "data": "[DONE]"}

    return EventSourceResponse(event_generator())