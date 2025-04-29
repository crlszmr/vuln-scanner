# backend/app/models/cve_cwe.py

from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base
from sqlalchemy import PrimaryKeyConstraint


class CveCwe(Base):
    __tablename__ = "cve_cwe"

    cve_name = Column(String, nullable=False)
    cwe_id = Column(String, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint('cve_name', 'cwe_id'),
    )
