# app/config/endpoints.py
NVD_IMPORT_KEYWORD = "/cve-import-keyword"
NVD_IMPORT_ALL = "/cve-import-all"

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