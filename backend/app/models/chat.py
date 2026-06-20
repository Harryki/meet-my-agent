from sqlalchemy import Boolean, Column, ForeignKey, String
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class Chat(Base, TimestampMixin):
    __tablename__ = "chats"

    id = Column(String, primary_key=True, default=generate_uuid)
    uuid = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    consumer_id = Column(String, ForeignKey("users.id"), nullable=False)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    title = Column(String(255), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    consumer = relationship("User", lazy="selectin")
    agent = relationship("Agent", back_populates="chats", lazy="selectin")
    messages = relationship(
        "Message", back_populates="chat", lazy="selectin", order_by="Message.created_at"
    )
