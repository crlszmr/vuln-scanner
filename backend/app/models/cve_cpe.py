# backend/app/models/cve_cpe.py
from sqlalchemy import Column, String, ForeignKey, PrimaryKeyConstraint
from app.database import Base

class CveCpe(Base):
    __tablename__ = "cve_cpe"

    cve_name = Column(String, ForeignKey("vulnerabilities.cve_id", ondelete="CASCADE"), nullable=False)
    cpe_uri = Column(String, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("cve_name", "cpe_uri"),
    )
