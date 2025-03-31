# app/config/translations.py
TRANSLATIONS = {
    "en": {
        "user_created": "User created successfully",
        "user_updated": "User updated successfully",
        "user_deleted": "User deleted successfully",
        "username_taken": "Username already taken",
        "user_not_found": "User not found",
        "email_taken": "Email already taken",
        "wrong_user_pwd": "Invalid username or password",
        "vulnerability_created": "Vulnerability created successfully",
        "unauthorized": "Unauthorized access",
        "not_found": "Resource not found",
        "remove_test_db": "It was not possible to remove 'test.db'. It is still being used.",
        "error_create_user": "Error creating user: ",
        "login_failed": "Login failed: ",
        "no_token": "No access token received",
        "invalid_token": "Invalid token",
        "token_expired": "Token expired",
        "vuln_deleted": "Vulnerability deleted successfully",
        "invalid_credentials": "Invalid credentials",
        "vuln_not_found": "Vulnerability not found",
    },
    "es": {
        "user_created": "Usuario creado correctamente",
        "user_updated": "Usuario actualizado correctamente",
        "user_deleted": "Usuario eliminado correctamente",
        "user_not_found": "Usuario no encontrado",
        "username_taken": "El nombre de usuario ya está en uso",
        "email_taken": "El correo electrónico ya está en uso",
        "wrong_user_pwd": "Nombre de usuario o contraseña inválidos",
        "vulnerability_created": "Vulnerabilidad creada correctamente",
        "unauthorized": "Acceso no autorizado",
        "not_found": "Recurso no encontrado",
        "remove_test_db": "No se pudo eliminar 'test.db', ya que está siendo usada.",
        "error_create_user": "Error al crear el usuario: ",
        "login_failed": "Error de login: ",
        "no_token": "No se recibió token de acceso",
        "invalid_token": "Token no válido",
        "token_expired": "El token expiró",
        "vuln_deleted": "Vulnerabilidad eliminada correctamente",
        "invalid_credentials": "Credenciales erróneas",
        "vuln_not_found": "Vulnerabilidad no encontrada",
    }
}

DEFAULT_LANGUAGE = "en"

def get_message(key, lang=DEFAULT_LANGUAGE):
    # Devuelve mensaje traducido basado en la clave y lenguajes porporcionados como argumento
    return TRANSLATIONS.get(lang, TRANSLATIONS[DEFAULT_LANGUAGE]).get(key, key)