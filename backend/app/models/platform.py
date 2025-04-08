# backend/app/models/platform.py
from sqlalchemy import Column, Integer, String, Boolean, Table, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.relations import vulnerability_platform


class Platform(Base):
    __tablename__ = "platforms"

    id = Column(Integer, primary_key=True, index=True)
    cpe_uri = Column(String, unique=True, index=True)  # cpe.cpeName
    deprecated = Column(Boolean, default=False)         # deprecated
    deprecation_date = Column(DateTime, nullable=True)
    created = Column(DateTime, nullable=True)           # created
    last_modified = Column(DateTime, nullable=True)     # lastModified

    vulnerabilities = relationship("Vulnerability", secondary=vulnerability_platform, back_populates="platforms")
    titles = relationship("CpeTitle", back_populates="platform", cascade="all, delete-orphan")


