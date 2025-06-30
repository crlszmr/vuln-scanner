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

_matching_progress = {}
_progress_lock = Lock()

def reset_matching_progress(device_id: int):
    with _progress_lock:
        _matching_progress[device_id] = []

def append_matching_progress(device_id: int, message: str):
    with _progress_lock:
        _matching_progress.setdefault(device_id, []).append(message)

def get_matching_progress(device_id: int):
    with _progress_lock:
        return list(_matching_progress.get(device_id, []))

def clear_matching_progress(device_id: int):
    with _progress_lock:
        _matching_progress.pop(device_id, None)