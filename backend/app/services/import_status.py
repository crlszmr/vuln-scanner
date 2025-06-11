import asyncio
import json
from typing import Optional
from datetime import datetime

from app.database import SessionLocal
from app.models.vulnerability import Vulnerability

# Estado actual de la importación
_status = {
    "running": False,
    "imported": 0,
    "total": 0,
    "label": "",
    "done": False,
    "error": None
}

# Elementos de control de eventos e interrupciones
_event_queue: asyncio.Queue = asyncio.Queue()
_stop_event = asyncio.Event()
current_task: Optional[asyncio.Task] = None

def _log(message: str):
    """Registra un log con marca de tiempo."""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

# Permite consultar el estado actual desde otras partes del sistema
def get_import_status():
    return _status.copy()

# Restaura el estado a valores iniciales
def reset_status():
    _status.update({
        "running": False,
        "imported": 0,
        "total": 0,
        "label": "",
        "done": False,
        "error": None
    })
    global current_task
    current_task = None

# Devuelve si se ha solicitado detener la importación
def should_stop():
    _log("Verificando si se ha solicitado detener la importación.")
    return _stop_event.is_set()

# Publica un evento SSE al frontend
async def publish(event: dict):
    await _event_queue.put(json.dumps(event))

# Devuelve la cola de eventos SSE
def get_event_queue():
    return _event_queue

# Detiene manualmente la importación
def stop_import():
    global current_task, _stop_event, _event_queue
    _log("Solicitud de detención manual de la importación.")

    if current_task and not current_task.done():
        current_task.cancel()

    _stop_event.set()
    _status["running"] = False
    _status["label"] = "Importación detenida por el usuario"

# Devuelve si hay una tarea en curso
def is_running():
    return current_task is not None and not current_task.done()

# Asigna la tarea actual
def set_task(task: asyncio.Task):
    global current_task
    current_task = task

# Permite actualizar el estado dinámicamente
def update_status(key: str, value):
    _status[key] = value

# Ejecuta la función de importación en segundo plano
async def start_background_import(import_function):
    global _event_queue, _stop_event
    _log("Inicio de importación de CVEs en segundo plano.")

    if _status["running"]:
        _log("Ya hay una importación en curso. Abortando nuevo intento.")
        return

    reset_status()
    _status["running"] = True
    _stop_event.clear()
    _event_queue = asyncio.Queue()

    _status["label"] = "Obteniendo lista de CVEs desde la NVD..."
    await publish({
        "type": "start",
        "total": 0,
        "label": _status["label"]
    })

    try:
        async for raw_event in import_function(results_per_page=2000):
            event = json.loads(raw_event)

            if _stop_event.is_set():
                _log("Importación detenida por el usuario durante ejecución.")
                _status.update({"running": False, "label": "Importación detenida por el usuario"})
                await publish({"type": "done", "imported": _status["imported"], "total": _status["total"]})
                reset_status()
                break

            event_type = event.get("type")

            if event_type == "start":
                _status.update({
                    "imported": 0,
                    "total": event.get("total", 0),
                    "label": event.get("label", "Importando CVEs..."),
                    "stage": event.get("stage"),
                    "percentage": event.get("percentage")
                })
                await publish({**event})

            elif event_type == "progress":
                _status.update({
                    "imported": event.get("imported", _status["imported"]),
                    "total": event.get("total", _status["total"]),
                    "label": event.get("label", _status["label"]),
                    "stage": event.get("stage", _status.get("stage")),
                    "percentage": event.get("percentage", _status.get("percentage"))
                })

            elif event_type == "warning":
                message = event.get("message") or "Se recibió un aviso sin mensaje detallado."
                _log(f"Aviso: {message}")
                _status.update({"running": False, "error": message})
                await publish({**event, "message": message})
                reset_status()
                break

            elif event_type == "done":
                _log("Importación finalizada correctamente.")
                _status.update({"running": False, "done": True})
                await publish({"type": "done", "imported": _status["imported"], "total": _status["total"]})
                reset_status()
                break

            elif event_type == "error":
                _log(f"Error durante importación: {event.get('message', 'Unknown error')}")
                _status.update({"running": False, "error": event.get("message", "Unknown error")})
                await publish({"type": "error", "message": _status["error"]})
                reset_status()
                break

            await publish(event)

    except asyncio.CancelledError:
        _log("Importación cancelada por asyncio.CancelledError.")
        _status.update({"running": False, "label": "Importación cancelada"})
        await publish({"type": "done", "imported": _status["imported"], "total": _status["total"]})
        reset_status()

    finally:
        # Restablecimiento para futuras importaciones
        _stop_event = asyncio.Event()
        _event_queue = asyncio.Queue()
