from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Body
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
from app.models.device_match import DeviceMatch
from app.models.device_config import DeviceConfig
from sqlalchemy import func
from app.models.vulnerability import Vulnerability
from app.schemas.device import CVEMarkRequest
from fastapi import status
from sqlalchemy import desc
from app.services import import_status_matching
from fastapi import BackgroundTasks


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
async def stream_matching_progress(device_id: int):
    from app.services import import_status_matching

    async def event_generator():
        last_index = 0
        while True:
            await asyncio.sleep(0.5)
            progress = import_status_matching.get_matching_progress(device_id)
            new = progress[last_index:]
            for msg in new:
                yield {"event": "message", "data": msg}
            last_index = len(progress)
            if "[DONE]" in progress or "[ERROR]" in progress:
                break

    return EventSourceResponse(event_generator())


@router.get("/devices/{device_id}/vulnerabilities")
def get_vulnerabilities_by_severity(
    device_id: int,
    severity: str = None,
    year: int = None,
    db: Session = Depends(get_db)
):
    query = (
        db.query(Vulnerability)
        .join(DeviceMatch, Vulnerability.cve_id == DeviceMatch.cve_name)
        .join(DeviceConfig, DeviceMatch.device_config_id == DeviceConfig.id)
        .filter(DeviceConfig.device_id == device_id)
        .filter(DeviceMatch.solved == False)  # 👈 solo las no solucionadas
    )

    if severity:
        if severity.upper() == "NONE":
            query = query.filter(Vulnerability.severity.is_(None))
        else:
            query = query.filter(Vulnerability.severity == severity)

    if year:
        query = query.filter(Vulnerability.cve_id.startswith(f"CVE-{year}"))  # 👈 por año desde cve_id

    return query.distinct().all()



@router.get("/devices/{device_id}/vulnerability-stats")
def get_vulnerability_stats(device_id: int, db: Session = Depends(get_db)):
    base_query = (
        db.query(Vulnerability.severity, func.count(func.distinct(Vulnerability.cve_id)))
        .join(DeviceMatch, Vulnerability.cve_id == DeviceMatch.cve_name)
        .join(DeviceConfig, DeviceMatch.device_config_id == DeviceConfig.id)
        .filter(DeviceConfig.device_id == device_id)
        .filter(DeviceMatch.solved == False)  # 👈 excluir solucionadas
        .group_by(Vulnerability.severity)
    )
    data = {sev if sev is not None else "NONE": count for sev, count in base_query.all()}

    total_query = (
        db.query(func.count(func.distinct(Vulnerability.cve_id)))
        .join(DeviceMatch, Vulnerability.cve_id == DeviceMatch.cve_name)
        .join(DeviceConfig, DeviceMatch.device_config_id == DeviceConfig.id)
        .filter(DeviceConfig.device_id == device_id)
        .filter(DeviceMatch.solved == False)  # 👈 excluir solucionadas
    )
    data["ALL"] = total_query.scalar()
    return data

@router.post("/devices/{device_id}/vulnerabilities/mark-solved")
def mark_vulnerabilities_as_solved(
    device_id: int,
    request: CVEMarkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verificar propiedad del dispositivo
    device = db.query(models.Device).filter_by(id=device_id, user_id=current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Buscar coincidencias y marcar como solucionadas
    matches = db.query(DeviceMatch).join(DeviceConfig).filter(
        DeviceConfig.device_id == device_id,
        DeviceMatch.cve_name.in_(request.cve_ids)
    ).all()

    for match in matches:
        match.solved = True

    db.commit()
    return {"status": "ok", "marked": request.cve_ids}

@router.get("/devices/{device_id}/last-matching", status_code=status.HTTP_200_OK)
def get_last_device_matching(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verifica que el dispositivo pertenece al usuario
    device = db.query(models.Device).filter_by(id=device_id, user_id=current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    # Busca el match más reciente
    last_match = (
        db.query(DeviceMatch.timestamp)
        .join(DeviceConfig, DeviceMatch.device_config_id == DeviceConfig.id)
        .filter(DeviceConfig.device_id == device_id)
        .order_by(desc(DeviceMatch.timestamp))
        .first()
    )

    return { "timestamp": last_match[0].isoformat() if last_match else None }

@router.get("/devices/{device_id}/match-status")
def get_match_status(device_id: int):
    from app.services import import_status_matching
    return {"running": import_status_matching.is_matching_active(device_id)}

@router.post("/devices/{device_id}/match-start")
def start_matching_background(
    device_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(models.Device).filter_by(id=device_id, user_id=current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if import_status_matching.is_matching_active(device_id):
        return {"status": "already_running"}

    import_status_matching.set_matching_active(device_id, True)
    import_status_matching.reset_matching_progress(device_id)

    def run_matching():
        try:
            generator = match_platforms_for_device(device_id, db, yield_progress=True)
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            async def consume():
                async for msg in generator:
                    import_status_matching.append_matching_progress(device_id, msg)
            loop.run_until_complete(consume())
        except Exception as e:
            import_status_matching.append_matching_progress(device_id, f"[ERROR] {str(e)}")
        finally:
            import_status_matching.clear_matching_status(device_id)
            import_status_matching.append_matching_progress(device_id, "[DONE]")

    background_tasks.add_task(run_matching)
    return {"status": "started"}

@router.get("/devices/{device_id}/config/with-cves", response_model=list[dict])
def get_configs_with_cves(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(models.Device).filter_by(id=device_id, user_id=current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    configs = db.query(DeviceConfig).filter(DeviceConfig.device_id == device_id).all()

    enriched = []
    for config in configs:
        matches = (
            db.query(DeviceMatch)
            .filter(DeviceMatch.device_config_id == config.id)
            .order_by(DeviceMatch.timestamp.desc())
            .all()
        )

        cve_ids = [m.cve_name for m in matches]

        vulns = db.query(models.Vulnerability).filter(models.Vulnerability.cve_id.in_(cve_ids)).all()
        vulns_dict = {v.cve_id: v for v in vulns}

        cve_data = [
            {
                "cve_id": m.cve_name,
                "solved": m.solved,
                "published": vulns_dict.get(m.cve_name).published if m.cve_name in vulns_dict else None,
                "severity": vulns_dict.get(m.cve_name).severity if m.cve_name in vulns_dict else None,
            }
            for m in matches
            if m.cve_name in vulns_dict  # solo los que existen en vulnerabilidades
        ]

        last_analysis = matches[0].timestamp.isoformat() if matches else None

        enriched.append({
            "id": config.id,
            "type": config.type,
            "vendor": config.vendor,
            "product": config.product,
            "version": config.version,
            "cves": cve_data,
            "last_analysis": last_analysis,
        })

    return enriched

@router.delete("/devices/{device_id}/match-platforms")
def delete_device_matching(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(models.Device).filter_by(id=device_id, user_id=current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    config_ids = db.query(DeviceConfig.id).filter(DeviceConfig.device_id == device_id).all()
    config_ids = [id for (id,) in config_ids]

    if not config_ids:
        return {"status": "no_configs"}

    total_matches = db.query(DeviceMatch).filter(DeviceMatch.device_config_id.in_(config_ids)).count()
    if total_matches == 0:
        return {"status": "no_matches"}

    db.query(DeviceMatch).filter(DeviceMatch.device_config_id.in_(config_ids)).delete(synchronize_session=False)
    db.commit()

    return {"status": "deleted", "deleted_matches": total_matches}

@router.delete("/devices/{device_id}")
def delete_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(models.Device).filter_by(id=device_id, user_id=current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    db.query(DeviceMatch).filter(
        DeviceMatch.device_config_id.in_(
            db.query(DeviceConfig.id).filter_by(device_id=device_id)
        )
    ).delete(synchronize_session=False)

    db.query(DeviceConfig).filter_by(device_id=device_id).delete(synchronize_session=False)
    db.delete(device)
    db.commit()

    return {"status": "deleted"}

