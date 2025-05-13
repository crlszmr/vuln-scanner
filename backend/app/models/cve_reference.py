# backend/app/models/cve_reference.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class CveReference(Base):
    __tablename__ = "cve_references"

    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(Integer, ForeignKey("vulnerabilities.id"), nullable=False)
    url = Column(String, nullable=False)
    name = Column(String, nullable=True)
    tags = Column(String, nullable=True)

    vulnerability = relationship("Vulnerability", back_populates="references")