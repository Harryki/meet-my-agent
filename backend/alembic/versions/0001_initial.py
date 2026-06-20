"""empty message

Revision ID: 0001
Revises:
Create Date: 2026-06-20
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("role", sa.Enum("provider", "consumer", name="userrole"), nullable=False),
        sa.Column("google_sub", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("google_sub"),
    )
    op.create_table(
        "agents",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("persona", sa.Text(), nullable=True),
        sa.Column("system_prompt", sa.Text(), nullable=True),
        sa.Column("model_config", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_table(
        "files",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("mime_type", sa.String(128), nullable=True),
        sa.Column("size", sa.BigInteger(), nullable=False),
        sa.Column("storage_path", sa.String(512), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_table(
        "chats",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("consumer_id", sa.String(), nullable=False),
        sa.Column("agent_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_table(
        "messages",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("chat_id", sa.String(), nullable=False),
        sa.Column(
            "role", sa.Enum("user", "assistant", "system", name="messagerole"), nullable=False
        ),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "completed", "failed", name="messagestatus"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )


def downgrade() -> None:
    op.drop_table("messages")
    op.drop_table("chats")
    op.drop_table("files")
    op.drop_table("agents")
    op.drop_table("users")
