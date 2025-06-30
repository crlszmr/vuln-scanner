from sqlalchemy import Column, String, ForeignKey, PrimaryKeyConstraint
from app.database import Base

class CveCpe(Base):
    __tablename__ = "cve_cpe"

    cve_name = Column(String, ForeignKey("vulnerabilities.cve_id", ondelete="CASCADE"), nullable=False)
    cpe_uri = Column(String, nullable=False)
    version_start_including = Column(String, nullable=True)
    version_start_excluding = Column(String, nullable=True)
    version_end_including = Column(String, nullable=True)
    version_end_excluding = Column(String, nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("cve_name", "cpe_uri"),
    )
