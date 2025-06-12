# backend/app/services/import_status_cpe.py

import asyncio
import json
from typing import Optional
from datetime import datetime

# Estado actual de la importación de CPEs
_status = {
    "running": False,
    "imported": 0,
    "total": 0,
    "label": "",
    "done": False,
    "error": None,
    "stage": "",       # Nuevo campo para la etapa actual (e.g., downloading_xml, parsing_xml, inserting_db)
    "percentage": 0    # Nuevo campo para el porcentaje de progreso dentro de la etapa
}

# Elementos de control de eventos e interrupciones
_event_queue: asyncio.Queue = asyncio.Queue()
_stop_event = asyncio.Event()
current_task: Optional[asyncio.Task] = None

def _log(message: str):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

def get_import_status():
    return _status.copy()

def reset_status():
    _status.update({
        "running": False,
        "imported": 0,
        "total": 0,
        "label": "",
        "done": False,
        "error": None,
        "stage": "",
        "percentage": 0
    })
    global current_task
    current_task = None

def should_stop():
    return _stop_event.is_set()

async def publish(event: dict):
    """
    Publica un evento en la cola para ser enviado al frontend vía SSE.
    Asegura que los campos stage y percentage se propaguen si están en el evento.
    """
    if "stage" in event:
        update_status("stage", event["stage"])
    if "percentage" in event:
        update_status("percentage", event["percentage"])
    await _event_queue.put(json.dumps(event))

def get_event_queue():
    return _event_queue

def stop_import():
    global current_task, _stop_event, _event_queue
    _log("Solicitud de detención manual de la importación de cpe.")
    if current_task and not current_task.done():
        current_task.cancel()
    _stop_event.set()
    _status["running"] = False
    _status["label"] = "Importación detenida por el usuario"
    # No resetear la cola aquí, permitir que el mensaje de 'detenido' se envíe.

def is_running():
    return current_task is not None and not current_task.done()

def set_task(task: asyncio.Task):
    global current_task
    current_task = task

def update_status(key: str, value):
    """Actualiza un campo específico del estado de importación."""
    _status[key] = value

def start(resource: str, label: str = "", stage: str = "", total: int = 0):
    """Inicia el proceso de importación o una nueva etapa."""
    _log(f"Iniciando importación de {resource}. Etapa: {stage}")
    _status.update({
        "running": True,
        "imported": 0,
        "total": total,
        "label": label or f"Importando {resource}...",
        "done": False,
        "error": None,
        "stage": stage,
        "percentage": 0
    })

def fail(resource: str, message: str):
    """Marca la importación como fallida."""
    _log(f"Fallo durante la importación de {resource}: {message}")
    _status.update({
        "running": False,
        "done": False,
        "error": message,
        "label": f"Error en la importación de {resource}",
        "stage": "error", # Añadimos una etapa de error para el frontend
        "percentage": 0
    })

def finish(resource: str, imported: int, total: int, label: str = ""):
    """Marca la importación como completada."""
    _log(f"Importación de {resource} finalizada.")
    _status.update({
        "running": False,
        "imported": imported,
        "total": total,
        "label": label or f"Importación de {resource} completada.",
        "done": True,
        "stage": "completed", # Añadimos una etapa de completado
        "percentage": 100
    })

async def start_background_import(import_function):
    """
    Gestiona la ejecución de una función de importación en segundo plano,
    manejando el estado y la comunicación de eventos.
    """
    global _event_queue, _stop_event
    _log("Inicio de importación de cpe en segundo plano.")

    if _status["running"]:
        _log("Ya hay una importación en curso. Abortando nuevo intento.")
        return

    reset_status()
    _stop_event.clear()
    _event_queue = asyncio.Queue() # Reiniciar la cola para una nueva importación

    try:
        # Aquí es donde se llamaría a tu función principal de importación (e.g., desde el servicio NVD)
        # Esta función debe encargarse de llamar a `publish` con los distintos estados.
        await import_function()

    except asyncio.CancelledError:
        _log("Importación cancelada por asyncio.CancelledError.")
        _status.update({"running": False, "label": "Importación cancelada", "stage": "cancelled"})
        await publish({"type": "done", "imported": _status["imported"], "total": _status["total"], "label": _status["label"], "stage": _status["stage"]})
    except Exception as e:
        _log(f"Excepción inesperada durante la importación: {e}")
        _status.update({"running": False, "label": f"Error inesperado: {e}", "stage": "error"})
        await publish({"type": "error", "message": f"Error inesperado: {e}", "label": _status["label"], "stage": _status["stage"]})
    finally:
        # Asegurarse de que el estado final se publique incluso después de un error o cancelación
        if _status["running"]: # Si no se ha marcado como done/error/cancelled explícitamente en la función de importación
            finish("CPEs", _status["imported"], _status["total"], _status["label"])
            await publish({"type": "done", "imported": _status["imported"], "total": _status["total"], "label": _status["label"], "stage": _status["stage"]})
        
        # Limpiar al finalizar (sea éxito, error o cancelación)
        _stop_event = asyncio.Event()
        # No limpiar _event_queue inmediatamente si hay clientes SSE que aún necesitan el último mensaje
        # Se limpiará al inicio de la próxima importación.