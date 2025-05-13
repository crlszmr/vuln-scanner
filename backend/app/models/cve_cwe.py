# backend/app/models/cve_cwe.py
from sqlalchemy import Column, String, ForeignKey, PrimaryKeyConstraint
from app.database import Base

class CveCwe(Base):
    __tablename__ = "cve_cwe"

    cve_name = Column(String, ForeignKey("vulnerabilities.cve_id", ondelete="CASCADE"), nullable=False)
    cwe_id = Column(String, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint('cve_name', 'cwe_id'),
    )
