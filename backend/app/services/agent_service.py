from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.user import User


async def get_active_agents(db: AsyncSession) -> list[Agent]:
    result = await db.execute(
        select(Agent).where(Agent.is_active == True)  # noqa: E712
    )
    return list(result.scalars().all())


async def get_agent_by_uuid(db: AsyncSession, agent_uuid: str) -> Agent | None:
    result = await db.execute(select(Agent).where(Agent.uuid == agent_uuid))
    return result.scalar_one_or_none()


async def update_agent(db: AsyncSession, agent: Agent, data: dict, user: User) -> Agent:
    if agent.user_id != user.id:
        raise PermissionError("You can only update your own agent")

    for key, value in data.items():
        if value is not None and hasattr(agent, key):
            setattr(agent, key, value)

    await db.commit()
    await db.refresh(agent)
    return agent
