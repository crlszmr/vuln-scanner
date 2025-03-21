# app/config/endpoints.py

ENDPOINTS = {
    "auth": "/auth",
    "register": "/auth/register",
    "register_short": "/register",
    "login": "/auth/login",
    "login_short": "/login",
    "update_user": "/auth/update/{username}",
    "update_user_short": "/update/{username}",
    "delete_user": "/auth/delete/{username}",
    "delete_user_short": "/delete/{username}",
    "get_user": "/auth/me",
    "create_vulnerability": "/vulnerabilities/",
    "update_vulnerability": "/vulnerabilities/{id}",
    "delete_vulnerability": "/vulnerabilities/delete/{id}",
    "list_vulnerabilities": "/vulnerabilities/",
    "create_vulnerability_short": "/",
    "update_vulnerability_short": "/{vuln_id}",
    "delete_vulnerability_short": "/delete/{vuln_id}",
    "list_vulnerabilities_short": "/",
}