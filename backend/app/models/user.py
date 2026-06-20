import enum

from sqlalchemy import Column, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class UserRole(str, enum.Enum):
    provider = "provider"
    consumer = "consumer"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    uuid = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.consumer)
    google_sub = Column(String(255), unique=True, nullable=True)

    agent = relationship("Agent", back_populates="user", uselist=False, lazy="selectin")
    files = relationship("FileMetadata", back_populates="user", lazy="selectin")
