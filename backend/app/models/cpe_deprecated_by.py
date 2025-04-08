# backend/app/models/cpe_deprecated_by.py
from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class CpeDeprecatedBy(Base):
    __tablename__ = "cpe_deprecated_by"

    id = Column(Integer, primary_key=True, index=True)
    platform_id = Column(Integer, ForeignKey("platforms.id", ondelete="CASCADE"), nullable=False)
    deprecated_by_cpe = Column(String, nullable=False)
