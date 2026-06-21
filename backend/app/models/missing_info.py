from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class MissingInfoReport(Base, TimestampMixin):
    __tablename__ = "missing_info_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    uuid = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    chat_id = Column(String, ForeignKey("chats.id"), nullable=True)
    question = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="pending") # e.g. pending, answered

    agent = relationship("Agent", lazy="selectin")
    chat = relationship("Chat", lazy="selectin")
