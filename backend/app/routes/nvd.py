# backend/app/routes/nvd.py
from app.config.endpoints import CVE_IMPORT_KEYWORD, CVE_IMPORT_ALL, VULNERABILITIES_BASE, CPE_IMPORT_ALL, CWE_IMPORT_ALL
from fastapi import APIRouter, Query, status, BackgroundTasks
from fastapi.responses import JSONResponse
from app.services.nvd import get_cves_by_keyword
from app.services.importer import parse_cves_from_nvd, save_cves_to_db, import_all_cves, import_all_cpes, get_cpe_import_progress
from app.database import SessionLocal
from app.services.importer import import_all_weaknesses_from_file, download_weakness_xml_if_needed
from app.routes.auth import get_current_user
from fastapi import HTTPException
from fastapi import APIRouter, Query, Body, Depends, HTTPException, status
from app.services.importer import import_all_cpes, cpe_import_progress, cpe_import_lock
from app.models.platform import Platform
from app.routes.auth import get_current_user
from app.services.auth import verify_password
from app.database import SessionLocal





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
def import_all_cves_from_nvd_ep(max_pages: int = Query(1, ge=1, le=1000, description="Número máximo de páginas a importar")):
    imported_count = import_all_cves(max_pages=max_pages)
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": f"{imported_count} CVEs imported successfully (max_pages={max_pages})."}
    )

# ✅ Nuevo endpoint: Importar CPEs (en background)
@router.post(CPE_IMPORT_ALL, status_code=status.HTTP_202_ACCEPTED)
def import_all_cpes_from_nvd_ep(background_tasks: BackgroundTasks):
    background_tasks.add_task(import_all_cpes)
    return {"message": "Importación de CPEs iniciada."}

# ✅ Nuevo endpoint: Consultar progreso de la importación
@router.get("/cpe-import-status", status_code=status.HTTP_200_OK)
def get_cpe_import_status():
    return get_cpe_import_progress()

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

@router.post("/cpe-import-cancel", status_code=status.HTTP_202_ACCEPTED)
def cancel_cpe_import():
    with cpe_import_lock:
        cpe_import_progress["cancel"] = True
        cpe_import_progress["status"] = "cancelled"
    return {"message": "Importación de CPE cancelada."}

@router.post("/cpe-delete-all", status_code=status.HTTP_202_ACCEPTED)
def delete_all_cpes(password: str = Body(...), current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Solo el administrador puede eliminar todos los CPEs.")

        if not verify_password(password, current_user["password"]):
            raise HTTPException(status_code=403, detail="Contraseña incorrecta.")

        deleted = db.query(Platform).delete()
        db.commit()
        return {"message": f"Se eliminaron {deleted} CPEs correctamente."}
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
