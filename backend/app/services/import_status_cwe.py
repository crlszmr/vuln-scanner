import asyncio
from threading import Event
import json

_status = {
    "running": False,
    "label": "",
    "imported": 0,
    "total": 0,
    "percentage": 0,
    "count": 0,
    "current": 0
}
_event_queue = asyncio.Queue()
_stop_event = Event()
_task = None


def get_import_status():
    return _status


def set_label(label):
    _status["label"] = label
    _event_queue.put_nowait(_build_event("label"))


def set_progress(imported=None, total=None, percentage=None, count=None, current=None):
    if imported is not None:
        _status["imported"] = imported
    if total is not None:
        _status["total"] = total
    if percentage is not None:
        _status["percentage"] = percentage
    if count is not None:
        _status["count"] = count
    if current is not None:
        _status["current"] = current
    _event_queue.put_nowait(_build_event("progress"))


def _build_event(event_type):
    return json_string({
        "type": event_type,
        "imported": _status["imported"],
        "total": _status["total"],
        "percentage": _status["percentage"],
        "label": _status["label"],
        "count": _status["count"],
        "current": _status["current"]
    })


def set_done():
    _status["running"] = False
    _event_queue.put_nowait(json_string({"type": "done", "imported": _status["imported"]}))

def finish(resource="cwe", imported=0, total=0, label=""):
    _status["running"] = False
    _status["imported"] = imported
    _status["total"] = total
    _status["label"] = label
    _status["percentage"] = 100
    _event_queue.put_nowait(json_string({
        "type": "done",
        "imported": imported,
        "total": total,
        "percentage": 100,
        "label": label,
    }))



def set_warning(message):
    _status["running"] = False
    _event_queue.put_nowait(json_string({"type": "warning", "message": message}))


def stop_import():
    _stop_event.set()


def should_stop():
    return _stop_event.is_set()


def reset_import():
    _status.update({
        "running": False,
        "label": "",
        "imported": 0,
        "total": 0,
        "percentage": 0,
        "count": 0,
        "current": 0
    })
    while not _event_queue.empty():
        _event_queue.get_nowait()
    _stop_event.clear()


def json_string(obj):
    import json
    return json.dumps(obj)


def get_event_queue():
    return _event_queue


def is_running():
    return _status["running"]


def set_task(task):
    global _task
    _task = task
    _status["running"] = True


async def start_background_import(import_function):
    reset_import()
    try:
        await import_function()
    except Exception as e:
        set_warning(str(e))
    finally:
        _status["running"] = False

def start(resource: str = "cwe", label: str = ""):
    reset_import()
    _status["running"] = True
    _status["label"] = label
    _event_queue.put_nowait(json_string({
        "type": "label",
        "label": label,
        "imported": 0,
        "total": 0,
        "percentage": 0
    }))

async def publish(event: dict):
    await _event_queue.put(json.dumps(event))