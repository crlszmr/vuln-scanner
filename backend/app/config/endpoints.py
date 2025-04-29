# app/config/endpoints.py
CVE_IMPORT_KEYWORD = "/cve-import-keyword"
CVE_IMPORT_ALL = "/cve-import-all"
CPE_IMPORT_ALL = "/cpe-import-all"
CWE_IMPORT_ALL = "/cwe-import-all"

AUTH_BASE = "/auth"
REGISTER = "/register"
LOGIN = "/login"
UPDATE_USER = "/update/{username}"
DELETE_USER = "/delete/{username}"
GET_USER = "/me"

VULNERABILITIES_BASE = "/vulnerabilities"
CREATE_VULNERABILITY = "/create"
UPDATE_VULNERABILITY = "/update/{id}"
DELETE_VULNERABILITY = "/delete/{id}"
LIST_VULNERABILITIES = "/list"