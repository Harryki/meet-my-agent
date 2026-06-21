import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.models.agent import Agent
from app.models.user import User
from app.models.file import FileMetadata
from app.models.chat import Chat
from app.models.message import Message, MessageStatus, MessageRole
from app.models.missing_info import MissingInfoReport
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

async def main():
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as db:
        agent_result = await db.execute(select(Agent).limit(1))
        agent = agent_result.scalar_one_or_none()
        if not agent:
            print("No agent found, creating dummy agent")
            user = User(email="test@example.com", name="Test User", role="provider", google_sub="123")
            db.add(user)
            await db.flush()
            agent = Agent(user_id=user.id, name="Test Agent", persona="I am a test agent", is_active=True)
            db.add(agent)
            await db.commit()
            await db.refresh(agent)
        
        print(f"Testing with agent: {agent.name}")

        chat = Chat(agent_id=agent.id, consumer_id=agent.user_id)
        db.add(chat)
        await db.commit()

        user_msg = Message(
            chat_id=chat.id,
            role=MessageRole.user,
            content="Who is the president of the moon in 2040?",
            status=MessageStatus.completed
        )
        db.add(user_msg)
        await db.commit()

        assistant_msg = Message(
            chat_id=chat.id,
            role=MessageRole.assistant,
            content="",
            status=MessageStatus.completed
        )
        db.add(assistant_msg)
        await db.commit()

        # Run worker function
        from worker.main import _process
        await _process(chat.uuid, assistant_msg.uuid, "test_user_uuid")

        await db.refresh(assistant_msg)
        print("Assistant reply:", assistant_msg.content)

        missing_result = await db.execute(
            select(MissingInfoReport).where(MissingInfoReport.chat_id == chat.id)
        )
        reports = missing_result.scalars().all()
        print("Missing Info Reports saved:", len(reports))
        for r in reports:
            print("-", r.question)

if __name__ == "__main__":
    asyncio.run(main())
