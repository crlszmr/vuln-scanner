# backend/app/models/platform.py
from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class CveDescription(Base):
    __tablename__ = "cve_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(Integer, ForeignKey("vulnerabilities.id"), nullable=False)
    lang = Column(String, nullable=False)
    value = Column(Text, nullable=False)

    vulnerability = relationship("Vulnerability", back_populates="descriptions")
