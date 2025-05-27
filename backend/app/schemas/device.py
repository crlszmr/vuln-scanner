from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime


# DeviceConfig schema → Representa hardware, os, applications subidas desde system_config.json

class DeviceConfigBase(BaseModel):
    type: Literal["h", "o", "a"]
    vendor: str
    product: str
    version: Optional[str] = None


class DeviceConfigCreate(DeviceConfigBase):
    pass


class DeviceConfig(DeviceConfigBase):
    id: int

    class Config:
        from_attributes = True


# Device schema → Alias, tipo, os_name y las configuraciones asociadas

class DeviceBase(BaseModel):
    alias: str
    type: Optional[str] = Field(default=None, description="e.g. laptop, server, desktop")
    os_name: Optional[str] = None


class DeviceCreate(DeviceBase):
    pass  # Ya no lleva lista de CPEs, solo alias, tipo y os_name


class Device(DeviceBase):
    id: int
    created_at: datetime
    config: List[DeviceConfig] = []

class Config:
    from_attributes = True
