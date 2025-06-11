import asyncio
import json
from typing import Optional

from app.services.nvd import get_all_cve_ids, get_cves_by_id
from app.database import SessionLocal
from app.models.vulnerability import Vulnerability
from app.services.nvd import get_total_cve_count_from_nvd

_status = {
    "running": False,
    "imported": 0,
    "total": 0,
    "label": "",
    "done": False,
    "error": None
}

_event_queue: asyncio.Queue = asyncio.Queue()
_stop_event = asyncio.Event()
current_task: Optional[asyncio.Task] = None

def get_import_status():
    return {
        "running": _status["running"],
        "imported": _status["imported"],
        "total": _status["total"],
        "label": _status["label"],
        "done": _status["done"],
        "error": _status["error"]
    }

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

def should_stop():
    print(f"📍 should_stop() llamado desde: {__name__}, _stop_event.is_set()={_stop_event.is_set()}")
    return _stop_event.is_set()

async def publish(event: dict):
    await _event_queue.put(json.dumps(event))

def get_event_queue():
    return _event_queue

def stop_import():
    global current_task, _stop_event, _event_queue
    print("🛑 stop_import() → Deteniendo importación manualmente")

    if current_task and not current_task.done():
        current_task.cancel()

    _stop_event.set()
    _status["running"] = False
    _status["label"] = "Importación detenida por el usuario"

def is_running():
    return current_task is not None and not current_task.done()

def set_task(task: asyncio.Task):
    global current_task
    current_task = task

def update_status(key: str, value):
    _status[key] = value

async def start_background_import(import_function):
    global _event_queue, _stop_event
    print("🚀 Comenzando importación de CVEs en segundo plano")
    await asyncio.sleep(0)

    if _status["running"]:
        print("⚠️ Ya hay una importación en curso")
        return

    reset_status()
    _status["running"] = True
    _stop_event.clear()
    _event_queue = asyncio.Queue()

    _status["label"] = "Obteniendo lista de CVEs desde la NVD..."
    _status["imported"] = 0
    _status["total"] = 0
    await publish({
        "type": "start",
        "total": 0,
        "label": _status["label"]
    })

    try:
        async for raw_event in import_function(results_per_page=2000):
            event = json.loads(raw_event)

            if _stop_event.is_set():
                print("🛑 Importación detenida manualmente")
                _status["label"] = "Importación detenida por el usuario"
                _status["running"] = False
                await publish({
                    "type": "done",
                    "imported": _status["imported"],
                    "total": _status["total"]
                })
                reset_status()
                break

            if event.get("type") == "start":
                _status["imported"] = 0
                _status["total"] = event.get("total", 0)
                _status["label"] = event.get("label", "Importando CVEs...")
                _status["stage"] = event.get("stage", None)
                _status["percentage"] = event.get("percentage", None)

                await publish({
                    "type": "start",
                    "total": _status["total"],
                    "label": _status["label"],
                    "stage": _status["stage"],
                    "percentage": _status["percentage"]
                })

            elif event.get("type") == "progress":
                _status["imported"] = event.get("imported", _status["imported"])
                _status["total"] = event.get("total", _status["total"])
                _status["label"] = event.get("label", _status["label"])
                _status["stage"] = event.get("stage", _status.get("stage"))
                _status["percentage"] = event.get("percentage", _status.get("percentage"))

            elif event.get("type") == "warning":
                _status["running"] = False
                _status["error"] = event.get("message")
                await publish(event)
                await asyncio.sleep(0)  # 🔄 da tiempo al frontend a conectarse
                reset_status()
                break

            elif event.get("type") == "done":
                _status["running"] = False
                _status["done"] = True
                await publish({
                    "type": "done",
                    "imported": _status["imported"],
                    "total": _status["total"]
                })
                reset_status()
                break

            elif event.get("type") == "error":
                _status["running"] = False
                _status["error"] = event.get("message", "Unknown error")
                await publish({"type": "error", "message": _status["error"]})
                reset_status()
                break

            await publish(event)

    except asyncio.CancelledError:
        print("❌ Importación cancelada por asyncio.CancelledError")
        _status["label"] = "Importación cancelada"
        _status["running"] = False
        await publish({
            "type": "done",
            "imported": _status["imported"],
            "total": _status["total"]
        })
        reset_status()

    finally:
        # ✅ Aquí sí se reinicia para futuras importaciones
        _stop_event = asyncio.Event()
        _event_queue = asyncio.Queue()

