from sqlalchemy.orm import Session, joinedload
from typing import List

from app import models, schemas


def create_device(db: Session, obj_in: schemas.DeviceCreate, user_id: int):
    db_device = models.Device(
        alias=obj_in.alias,
        type=obj_in.type,
        os_name=obj_in.os_name,
        user_id=user_id
    )
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device



def get_devices_by_user(db: Session, user_id: int) -> List[models.device.Device]:
    return (
        db.query(models.device.Device)
        .options(joinedload(models.device.Device.config))  # 👈 importante
        .filter(models.device.Device.user_id == user_id)
        .all()
    )


def get_device(db: Session, device_id: int, user_id: int) -> models.device.Device:
    return db.query(models.device.Device).filter(
        models.device.Device.id == device_id,
        models.device.Device.user_id == user_id
    ).first()


def delete_device(db: Session, device_id: int, user_id: int) -> bool:
    device = get_device(db, device_id, user_id)
    if device:
        db.delete(device)
        db.commit()
        return True
    return False
