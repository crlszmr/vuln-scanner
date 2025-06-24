from fastapi import APIRouter, Query, status, BackgroundTasks, HTTPException, Body, Depends, Request
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
from app.config.endpoints import CVE_IMPORT_KEYWORD, CVE_IMPORT_ALL, VULNERABILITIES_BASE, CPE_IMPORT_ALL, CWE_IMPORT_ALL
from app.services.nvd import get_cves_by_keyword
from app.services.importer import (
    parse_cves_from_nvd,
    save_cves_to_db,
    import_all_cves_stream,
    import_cpes_from_xml,
)
from app.database import SessionLocal
from app.models.platform import Platform
from app.routes.auth import get_current_user
from app.services.auth import verify_password
from app.schemas.common import PasswordConfirmation
from app.models.user import User
from app.services import import_status_cve
import json
import asyncio
from sqlalchemy import text
from app.services import import_status_cpe
from app.services import import_status_cwe
from app.services import import_all_cwes_stream


from app.services.importer import import_all_cpes_stream  # asegúrate de crear esta función


from app.models.vulnerability import Vulnerability

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
        initial_status = import_status_cve.get_import_status()
        print(f"📨 Estado actual import_status: {initial_status}")

        # 🔧 Enviar evento de tipo label forzado (SÍ o SÍ)
        initial_event = {
            "type": "label",
            "label": initial_status.get("label", "Esperando eventos..."),
            "imported": initial_status.get("imported", 0),
            "total": initial_status.get("total", 0)
        }
        yield f"data: {json.dumps(initial_event)}\n\n"

        while not await request.is_disconnected():
            event = await import_status_cve.get_event_queue().get()
            yield f"data: {event}\n\n"

    return EventSourceResponse(event_generator())



@router.post("/cve-import-start", status_code=status.HTTP_202_ACCEPTED)
async def launch_cve_import():

    if import_status_cve.is_running():
        return {"message": "Importación ya en curso", "status": import_status_cve.get_import_status()}

    task = asyncio.create_task(import_status_cve.start_background_import(import_all_cves_stream))
    import_status_cve.set_task(task)

    return {"message": "Importación iniciada", "status": import_status_cve.get_import_status()}




@router.get("/cve-import-status", status_code=200)
def get_cve_import_status():
    return import_status_cve.get_import_status()

@router.post("/cve-import-stop", status_code=200)
def stop_import():
    import_status_cve.stop_import()
    return {"message": "Importación detenida manualmente"}

@router.delete("/cve-delete-all", status_code=200)
def delete_all_cves():
    db = SessionLocal()
    try:
        db.execute(text("TRUNCATE TABLE vulnerabilities CASCADE"))
        db.commit()
        return {"message": "Todos los CVEs eliminados correctamente."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar CVEs: {str(e)}")
    finally:
        db.close()

@router.get("/cve-count")
def cve_count():
    db = SessionLocal()
    try:
        count = db.query(Vulnerability).count()
        return {"count": count}
    finally:
        db.close()

@router.get("/cpe-import-stream")
async def stream_cpe_import(request: Request):
    print("[SSE-BACKEND] Conexión recibida en /nvd/cpe-import-stream")  # <---- Este print
    async def event_generator():
        initial_status = import_status_cpe.get_import_status()
        yield f"data: {json.dumps({**initial_status, 'type': 'label'})}\n\n"
        while not await request.is_disconnected():
            event = await import_status_cpe.get_event_queue().get()
            print("[SSE-BACKEND] Enviando evento SSE:", event)  # <---- Este print
            yield f"data: {event}\n\n"
    return EventSourceResponse(event_generator())



import threading

@router.post("/cpe-import-start", status_code=status.HTTP_202_ACCEPTED)
async def launch_cpe_import():
    from app.services.cpe_importer import import_all_cpes_stream

    if import_status_cpe.is_running():
        return {"message": "Importación ya en curso", "status": import_status_cpe.get_import_status()}

    # Lanza en un thread porque import_all_cpes_stream es en realidad bloqueante
    def run_import():
        import asyncio
        # Si tu función espera corutinas, crea un event loop aquí:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(import_status_cpe.start_background_import(import_all_cpes_stream))
        loop.close()

    thread = threading.Thread(target=run_import, daemon=True)
    thread.start()
    import_status_cpe.set_task(thread)

    return {"message": "Importación iniciada", "status": import_status_cpe.get_import_status()}



@router.post("/cpe-import-stop", status_code=200)
def stop_import():
    import_status_cpe.stop_import()
    return {"message": "Importación detenida manualmente"}


@router.get("/cpe-import-status", status_code=200)
def get_cpe_import_status():
    return import_status_cpe.get_import_status()

@router.get("/cwe-import-stream")
async def stream_cwe_import(request: Request):
    print("[SSE-BACKEND] Conexión recibida en /nvd/cwe-import-stream")

    async def event_generator():
        initial_status = import_status_cwe.get_import_status()
        yield f"data: {json.dumps({**initial_status, 'type': 'label'})}\n\n"
        while not await request.is_disconnected():
            event = await import_status_cwe.get_event_queue().get()
            yield f"data: {event}\n\n"

    return EventSourceResponse(event_generator())

@router.post("/cwe-import-start", status_code=status.HTTP_202_ACCEPTED)
async def launch_cwe_import():
    if import_status_cwe.is_running():
        return {"message": "Importación ya en curso", "status": import_status_cwe.get_import_status()}

    # Ejecutar en hilo porque import_all_cwes_stream es bloqueante
    def run_import():
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(import_status_cwe.start_background_import(import_all_cwes_stream))
        loop.close()

    thread = threading.Thread(target=run_import, daemon=True)
    thread.start()
    import_status_cwe.set_task(thread)

    return {"message": "Importación de CWEs iniciada", "status": import_status_cwe.get_import_status()}