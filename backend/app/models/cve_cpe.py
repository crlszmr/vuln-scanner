# backend/app/models/cve_cpe.py

from sqlalchemy import Column, String
from app.database import Base

class CveCpe(Base):
    __tablename__ = "cve_cpe"

    cve_name = Column(String, primary_key=True)
    cpe_uri = Column(String, primary_key=True)
