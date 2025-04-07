# backend/app/models/platform.py
from sqlalchemy import Column, Integer, String, Boolean, Table, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.relations import vulnerability_platform

class Platform(Base):
    __tablename__ = "platforms"

    id = Column(Integer, primary_key=True, index=True)
    cpe_uri = Column(String, unique=True, index=True)  # cpe.cpeName
    title = Column(String)                              # titles[0].title
    lang = Column(String, default="en")                 # titles[0].lang
    deprecated = Column(Boolean, default=False)         # deprecated
    deprecated_by = Column(String, nullable=True)       # deprecatedBy[0] (si existe)
    last_modified = Column(DateTime, nullable=True)     # lastModified
    created = Column(DateTime, nullable=True)           # created

    vulnerabilities = relationship("Vulnerability", secondary=vulnerability_platform, back_populates="platforms")

