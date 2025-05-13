from app.database import SessionLocal
from app.services.nvd import get_cves_by_page
from app.config.urls import (
    CWE_XML_URL, CWE_XML_PATH,
    CWE_ZIP_PATH, CPE_XML_URL,
    CPE_XML_PATH,
    CPE_XML_GZ_PATH
)
from app.crud import (
    cpe_deprecated_by as crud_deprecated,
    cpe_references as crud_references,
    cpe_titles as crud_titles,
    cve_cpe as crud_cve_cpe,
    cve_cwe as crud_cve_cwe,
    cve_descriptions as crud_desc,
    cve_references as crud_refs,
    platforms as crud_platforms,
    vulnerabilities as crud_vulns,
    weaknesses as crud_weaknesses
)
from app.models.platform import Platform
from app.schemas.cpe_deprecated_by import CpeDeprecatedByCreate
from app.schemas.cpe_reference import CPEReferenceCreate
from app.schemas.cpe_title import CpeTitleCreate
from app.models.vulnerability import Vulnerability
from app.models.cve_description import CveDescription
from app.models.cve_reference import CveReference
from app.models.cve_cpe import CveCpe
from app.models.cve_cwe import CveCwe
from app.schemas.vulnerability import VulnerabilityCreate
from app.schemas.weakness import WeaknessCreate
from datetime import datetime
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from asyncio import as_completed
from concurrent.futures import ThreadPoolExecutor
from app.services.utils import (
    extract_cvss_data_from_feed,
    extract_cvss_data,
    extract_text,
    serialize_blocks,
    serialize_elements,
    extract_multiple_as_json,
    decompress_once
)
from app.services.cpe_importer import (
    extract_all_cpes,
    extract_cpes_from_feed_config
)
import asyncio
import gzip
import json
import logging
import requests
import sys
import shutil
import time
import ijson
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)
