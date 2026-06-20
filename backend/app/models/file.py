from sqlalchemy import BigInteger, Column, ForeignKey, String
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class FileMetadata(Base, TimestampMixin):
    __tablename__ = "files"

    id = Column(String, primary_key=True, default=generate_uuid)
    uuid = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    mime_type = Column(String(128), nullable=True)
    size = Column(BigInteger, default=0, nullable=False)
    storage_path = Column(String(512), nullable=False)

    user = relationship("User", back_populates="files", lazy="selectin")
