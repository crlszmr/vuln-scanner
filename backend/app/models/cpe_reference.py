# backend/app/models/cpe_reference.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class CPEReference(Base):
    __tablename__ = "cpe_references"

    id = Column(Integer, primary_key=True, index=True)
    platform_id = Column(Integer, ForeignKey("platforms.id", ondelete="CASCADE"), nullable=False)
    ref = Column(String, nullable=False)
    type = Column(String, nullable=True)

    platform = relationship("Platform", back_populates="references")
