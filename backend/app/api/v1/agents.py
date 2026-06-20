from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, UserRole
from app.schemas.agent import AgentResponse, AgentUpdateRequest
from app.services import agent_service

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/", response_model=list[AgentResponse])
async def list_agents(db: AsyncSession = Depends(get_db)):
    agents = await agent_service.get_active_agents(db)
    return [
        AgentResponse(
            uuid=a.uuid,
            name=a.name,
            persona=a.persona,
            system_prompt=a.system_prompt,
            is_active=a.is_active,
        )
        for a in agents
    ]


@router.get("/{agent_uuid}", response_model=AgentResponse)
async def get_agent(agent_uuid: str, db: AsyncSession = Depends(get_db)):
    agent = await agent_service.get_agent_by_uuid(db, agent_uuid)
    if agent is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return AgentResponse(
        uuid=agent.uuid,
        name=agent.name,
        persona=agent.persona,
        system_prompt=agent.system_prompt,
        is_active=agent.is_active,
    )


@router.put("/{agent_uuid}", response_model=AgentResponse)
async def update_agent(
    agent_uuid: str,
    body: AgentUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.provider:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only providers can update agents",
        )

    agent = await agent_service.get_agent_by_uuid(db, agent_uuid)
    if agent is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    try:
        agent = await agent_service.update_agent(
            db, agent, body.model_dump(exclude_none=True), current_user
        )
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    return AgentResponse(
        uuid=agent.uuid,
        name=agent.name,
        persona=agent.persona,
        system_prompt=agent.system_prompt,
        is_active=agent.is_active,
    )
