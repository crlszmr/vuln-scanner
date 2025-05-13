from app.config.endpoints import CVE_IMPORT_KEYWORD, CVE_IMPORT_ALL, VULNERABILITIES_BASE, CPE_IMPORT_ALL, CWE_IMPORT_ALL
from fastapi import APIRouter, Query, status, BackgroundTasks, HTTPException, Body, Depends, Request
from fastapi.responses import JSONResponse
from app.services.nvd import get_cves_by_keyword
from app.services.importer import parse_cves_from_nvd, save_cves_to_db, import_all_cves, import_all_weaknesses_from_file, download_weakness_xml_if_needed
from app.services.importer import import_cpes_from_xml
from app.database import SessionLocal
from app.models.platform import Platform
from app.routes.auth import get_current_user
from app.services.auth import verify_password
from app.schemas.common import PasswordConfirmation
from app.models.user import User
from sse_starlette.sse import EventSourceResponse
from app.services.importer import import_all_cves_stream
from app.services.importer import import_all_cves_from_files
from app.services.importer import import_all_cves_from_files_stream




router = APIRouter(prefix="/nvd", tags=["nvd"])


@router.post(CVE_IMPORT_KEYWORD, status_code=status.HTTP_202_ACCEPTED)
def import_cves_by_keyword(keyword: str = Query(..., description="Palabra clave para buscar vulnerabilidades")):
    data = get_cves_by_keyword(keyword)
    vulns = parse_cves_from_nvd(data)

    db = SessionLocal()
    try:
        imported = save_cves_to_db(db, vulns)
    finally:
        db.close()

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": f"{imported} CVEs imported with keyword '{keyword}'."}
    )

@router.post(CVE_IMPORT_ALL, status_code=status.HTTP_202_ACCEPTED)
def import_all_cves_from_nvd_ep():
    imported_count = import_all_cves()
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": f"{imported_count} CVEs imported successfully."}
    )

@router.post(CWE_IMPORT_ALL, status_code=status.HTTP_202_ACCEPTED)
def import_all_weaknesses_from_nvd_ep(
    limit: int = Query(None, ge=1, description="Número máximo de debilidades a importar (None = todas)")
):
    download_weakness_xml_if_needed()
    filepath = "data/cwec_v4.12.xml"

    db = SessionLocal()
    try:
        count = import_all_weaknesses_from_file(filepath, db, limit=limit)
    finally:
        db.close()

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": f"{count} weaknesses imported successfully."}
    )

@router.post("/cpe-delete-all", status_code=status.HTTP_202_ACCEPTED)
def delete_all_cpes(payload: PasswordConfirmation, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador puede eliminar todos los CPEs.")
    
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status_code=403, detail="Contraseña incorrecta.")

    background_tasks.add_task(delete_cpes_background)

    return {"message": "Eliminación de CPEs iniciada en segundo plano."}

def delete_cpes_background():
    db = SessionLocal()
    try:
        deleted = db.query(Platform).delete()
        db.commit()
        print(f"🧹 [DEBUG] Eliminados {deleted} CPEs en background.")
    finally:
        db.close()

@router.get("/cpe-list", status_code=status.HTTP_200_OK)
def list_cpes():
    db = SessionLocal()
    try:
        cpes = db.query(Platform).limit(1000).all()
        return [{"id": c.id, "cpe_uri": c.cpe_uri, "deprecated": c.deprecated} for c in cpes]
    finally:
        db.close()

@router.post("/cpe-import-all-from-xml", status_code=status.HTTP_202_ACCEPTED)
def import_all_cpes_from_xml_ep():
    imported_count = import_cpes_from_xml()
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": f"{imported_count} CPEs imported successfully from XML."}
    )

@router.get("/cve-import-stream")
async def stream_cve_import(request: Request):
    async def event_generator():
        async for event in import_all_cves_stream():
            if await request.is_disconnected():
                break
            yield event
    return EventSourceResponse(event_generator())


@router.post("/cve-import-all-from-json", status_code=status.HTTP_202_ACCEPTED)
def import_all_cves_from_json_ep():
    imported_count = import_all_cves_from_files()
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"imported": imported_count}
    )

@router.get("/cve-import-from-json-stream", status_code=status.HTTP_202_ACCEPTED)
async def stream_import_from_json(request: Request):
    async def event_generator():
        print("🚀 Iniciando generador de eventos SSE")  # <--- IMPORTANTE

        async for event in import_all_cves_from_files_stream():
            print(f"📤 Enviando evento SSE: {event}")  # <--- VERIFICACIÓN
            if await request.is_disconnected():
                print("⚠️ Cliente desconectado")
                break
            yield event

    return EventSourceResponse(event_generator())
