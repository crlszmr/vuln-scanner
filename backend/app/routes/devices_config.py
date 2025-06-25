from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.routes.auth import get_current_user
import json
import app.crud.devices_config as crud_device_configs
from fastapi import Query
from sqlalchemy import func
from app.models.vulnerability import Vulnerability
from app.models.device_config import DeviceConfig
from app.models.device_match import DeviceMatch
from app.schemas.device import CVEMarkRequest



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


@router.get("/devices/{device_id}/config/{config_id}/vulnerabilities")
def get_vulnerabilities_for_device_config(
    device_id: int,
    config_id: int,
    severity: str = Query(None),
    year: int = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verifica que el dispositivo pertenece al usuario
    device = db.query(models.Device).filter_by(id=device_id, user_id=current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    # Verifica que la configuración pertenece al dispositivo
    config = db.query(DeviceConfig).filter_by(id=config_id, device_id=device_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")

    # Filtra vulnerabilidades por esta configuración concreta
    query = (
        db.query(Vulnerability)
        .join(DeviceMatch, Vulnerability.cve_id == DeviceMatch.cve_name)
        .filter(DeviceMatch.device_config_id == config_id)
        .filter(DeviceMatch.solved == False)  # ❗️Solo no solucionadas
    )

    if severity:
        if severity.upper() == "NONE":
            query = query.filter(Vulnerability.severity.is_(None))
        else:
            query = query.filter(Vulnerability.severity == severity)

    if year:
        query = query.filter(Vulnerability.cve_id.startswith(f"CVE-{year}"))

    return query.distinct().all()

@router.post("/devices/{device_id}/config/{config_id}/vulnerabilities/mark-solved")
def mark_config_vulns_as_solved(
    device_id: int,
    config_id: int,
    request: CVEMarkRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # ✅ Verifica que el dispositivo pertenece al usuario
    device = db.query(models.Device).filter_by(id=device_id, user_id=current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    # ✅ Verifica que la configuración pertenece al dispositivo
    config = db.query(DeviceConfig).filter_by(id=config_id, device_id=device_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")

    # ✅ Marca como solucionadas solo las vulnerabilidades de esa config
    matches = db.query(DeviceMatch).filter(
        DeviceMatch.device_config_id == config_id,
        DeviceMatch.cve_name.in_(request.cve_ids)
    ).all()

    for match in matches:
        match.solved = True

    db.commit()
    return {"status": "ok", "marked": [m.cve_name for m in matches]}