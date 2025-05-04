from sqlalchemy.orm import Session
from app.models.device_config import DeviceConfig
from app.schemas.device_config import DeviceConfigCreate


def create_device_config(db: Session, device_id: int, config: DeviceConfigCreate):
    db_config = DeviceConfig(
        device_id=device_id,
        type=config.type,
        vendor=config.vendor,
        product=config.product,
        version=config.version
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


def get_configs_by_device(db: Session, device_id: int):
    return db.query(DeviceConfig).filter(DeviceConfig.device_id == device_id).all()
