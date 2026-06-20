from pydantic import BaseModel


class AgentResponse(BaseModel):
    uuid: str
    name: str
    persona: str | None
    system_prompt: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class AgentUpdateRequest(BaseModel):
    name: str | None = None
    persona: str | None = None
    system_prompt: str | None = None
    is_active: bool | None = None
