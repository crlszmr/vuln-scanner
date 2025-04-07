# backend/app/models/relations.py
from sqlalchemy import Table, Column, Integer, ForeignKey
from app.database import Base

vulnerability_platform = Table(
    "vulnerability_platform",
    Base.metadata,
    Column("vulnerability_id", Integer, ForeignKey("vulnerabilities.id")),
    Column("platform_id", Integer, ForeignKey("platforms.id"))
)
