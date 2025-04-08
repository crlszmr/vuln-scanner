
# backend/app/models/cpe_title.py
from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base
from sqlalchemy.orm import relationship

class CpeTitle(Base):
    __tablename__ = "cpe_titles"

    id = Column(Integer, primary_key=True, index=True)
    platform_id = Column(Integer, ForeignKey("platforms.id", ondelete="CASCADE"), nullable=False)
    lang = Column(String, nullable=False)
    value = Column(String, nullable=False)

    platform = relationship("Platform", back_populates="titles")
