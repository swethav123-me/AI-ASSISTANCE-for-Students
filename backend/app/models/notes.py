from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class NoteFormat(str, enum.Enum):
    concise = "concise"
    detailed = "detailed"
    bullet_points = "bullet_points"
    revision = "revision"


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    note_format = Column(Enum(NoteFormat), default=NoteFormat.concise)
    content = Column(Text, nullable=False)
    key_concepts = Column(Text)
    summary = Column(Text)
    source_document_id = Column(Integer, ForeignKey("documents.id"))
    metadata_json = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="notes")