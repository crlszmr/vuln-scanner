# backend/app/models/platform.py
from sqlalchemy import Column, Integer, String, Boolean, Table, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Platform(Base):
    __tablename__ = "platforms"

    id = Column(Integer, primary_key=True, index=True)
    cpe_uri = Column(String, unique=True, index=True)  # cpe.cpeName
    vendor = Column(String, index=True)
    product = Column(String, index=True)
    version = Column(String, index=True)
    deprecated = Column(Boolean, default=False)         # deprecated
    imported_at = Column(DateTime, default=datetime.utcnow)

    vulnerabilities = relationship(
        "Vulnerability",
        secondary="cve_cpe",
        primaryjoin="Platform.cpe_uri == foreign(CveCpe.cpe_uri)",
        secondaryjoin="Vulnerability.cve_id == foreign(CveCpe.cve_name)",
        back_populates="platforms"
    )
    titles = relationship("CpeTitle", back_populates="platform", cascade="all, delete-orphan")
    references = relationship("CPEReference", back_populates="platform", cascade="all, delete-orphan")




