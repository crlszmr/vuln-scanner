# backend/app/routes/nvd.py
from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse
from app.services.nvd import fetch_cves_by_keyword
from app.services.importer import extract_cves_from_nvd, store_cves, import_all_cves
from app.database import SessionLocal

router = APIRouter(prefix="/nvd", tags=["nvd"])

@router.post("/cve-import-keyword", status_code=status.HTTP_202_ACCEPTED)
def import_cves_keyword(keyword: str = Query(..., description="Palabra clave para buscar vulnerabilidades")):
    """
    Importa CVEs desde NVD usando una palabra clave.
    """
    data = fetch_cves_by_keyword(keyword)
    vulns = extract_cves_from_nvd(data)

    db = SessionLocal()
    try:
        imported = store_cves(db, vulns)
    finally:
        db.close()

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": f"{imported} CVEs imported with keyword '{keyword}'."}
    )

@router.post("/cve-import-all", status_code=status.HTTP_202_ACCEPTED)
def import_all_cves_ep(max_pages: int = Query(1, ge=1, le=1000, description="Número máximo de páginas a importar")):
    """
    Importa CVEs desde la NVD en modo paginado (máx. 2000 resultados por página).
    """
    imported_count = import_all_cves(max_pages=max_pages)
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": f"{imported_count} CVEs imported successfully (max_pages={max_pages})."}
    )
