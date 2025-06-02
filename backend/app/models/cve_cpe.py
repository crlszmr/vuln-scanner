# backend/app/models/cve_cpe.py
from sqlalchemy import Column, String, ForeignKey
from app.database import Base

from sqlalchemy import PrimaryKeyConstraint

class CveCpe(Base):
    __tablename__ = "cve_cpe"

    cve_name = Column(String, nullable=False)
    cpe_uri = Column(String, nullable=False)
    # otros campos...

    __table_args__ = (
        PrimaryKeyConstraint("cve_name", "cpe_uri"),
    )