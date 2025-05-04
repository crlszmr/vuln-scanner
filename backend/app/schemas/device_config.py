from pydantic import BaseModel
from typing import Optional


class DeviceConfigBase(BaseModel):
    type: str
    vendor: str
    product: str
    version: Optional[str] = None


class DeviceConfigCreate(DeviceConfigBase):
    pass


class DeviceConfig(DeviceConfigBase):
    id: int
    device_id: int

    class Config:
        orm_mode = True
