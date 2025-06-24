# app/services/import_status_matching.py

from threading import Lock

# Estado por device_id
_matching_status = {}
_lock = Lock()

def set_matching_active(device_id: int, active: bool):
    with _lock:
        _matching_status[device_id] = active

def is_matching_active(device_id: int) -> bool:
    with _lock:
        return _matching_status.get(device_id, False)

def clear_matching_status(device_id: int):
    with _lock:
        _matching_status.pop(device_id, None)
