# Paso 1: Crear modelo `DeviceMatch`
# Archivo: backend/app/models/device_match.py

from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy import ForeignKeyConstraint

class DeviceMatch(Base):
    __tablename__ = "device_matches"

    id = Column(Integer, primary_key=True)
    device_config_id = Column(Integer, ForeignKey("device_config.id", ondelete="CASCADE"), nullable=False)
    
    cve_name = Column(String, nullable=False)
    cpe_uri = Column(String, nullable=False)

    matched_vendor = Column(String, nullable=True)
    matched_product = Column(String, nullable=True)
    match_type = Column(String, nullable=True)
    match_score = Column(Float, nullable=True)
    needs_review = Column(Boolean, default=False)
    solved = Column(Boolean, default=False, nullable=False)

    device_config = relationship("DeviceConfig", back_populates="matches")
    cve_cpe = relationship(
        "CveCpe",
        primaryjoin="and_(DeviceMatch.cve_name==CveCpe.cve_name, DeviceMatch.cpe_uri==CveCpe.cpe_uri)"
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["cve_name", "cpe_uri"],
            ["cve_cpe.cve_name", "cve_cpe.cpe_uri"],
            ondelete="CASCADE"
        ),
    )

