from sqlalchemy import Boolean, Column, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class Agent(Base, TimestampMixin):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, default=generate_uuid)
    uuid = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    persona = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=True)
    model_config = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="agent", lazy="selectin")
    chats = relationship("Chat", back_populates="agent", lazy="selectin")
