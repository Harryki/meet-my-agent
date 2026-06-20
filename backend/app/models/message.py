import enum

from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class MessageRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class MessageStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    uuid = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    chat_id = Column(String, ForeignKey("chats.id"), nullable=False)
    role = Column(SAEnum(MessageRole), nullable=False)
    content = Column(Text, nullable=True)
    status = Column(SAEnum(MessageStatus), nullable=False, default=MessageStatus.pending)

    chat = relationship("Chat", back_populates="messages", lazy="selectin")
