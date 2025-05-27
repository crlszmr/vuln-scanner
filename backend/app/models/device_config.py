from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class DeviceConfig(Base):
    __tablename__ = "device_config"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # hardware, os, application
    vendor = Column(String, nullable=False)
    product = Column(String, nullable=False)
    version = Column(String, nullable=True)

    # Relaciones
    device = relationship("Device", back_populates="config")
    matches = relationship("DeviceMatch", back_populates="device_config", cascade="all, delete-orphan")
