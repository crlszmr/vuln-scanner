# backend/app/models/weakness.py
from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class Weakness(Base):
    __tablename__ = "weaknesses"

    id = Column(Integer, primary_key=True, index=True)  # ID oficial de la CWE
    name = Column(String, nullable=False)
    abstraction = Column(String, nullable=True)
    structure = Column(String, nullable=True)
    status = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    extended_description = Column(Text, nullable=True)

    # Campos complejos como JSON serializado
    modes_of_introduction = Column(Text, nullable=True)
    applicable_platforms = Column(Text, nullable=True)
    alternate_terms = Column(Text, nullable=True)
    potential_mitigations = Column(Text, nullable=True)
    consequences = Column(Text, nullable=True)
    demonstrative_examples = Column(Text, nullable=True)
    observed_examples = Column(Text, nullable=True)
    taxonomy_mappings = Column(Text, nullable=True)
    relationships = Column(Text, nullable=True)
    background_details = Column(Text, nullable=True)