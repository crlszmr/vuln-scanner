# backend/app/routes/nvd.py
from app.config.endpoints import CVE_IMPORT_KEYWORD, CVE_IMPORT_ALL, VULNERABILITIES_BASE, CPE_IMPORT_ALL
from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse
from app.services.nvd import get_cves_by_keyword
from app.services.importer import parse_cves_from_nvd, save_cves_to_db, import_all_cves, import_all_cpes
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

@router.post(CPE_IMPORT_ALL, status_code=status.HTTP_202_ACCEPTED)
def import_all_cpes_from_nvd_ep(
    max_pages: int = Query(10, ge=1, le=100),
    results_per_page: int = Query(1000, ge=1, le=1000)
):
    imported_count = import_all_cpes(max_pages=max_pages, results_per_page=results_per_page)
    return {"imported": imported_count}