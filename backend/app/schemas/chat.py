from pydantic import BaseModel


class ChatCreateRequest(BaseModel):
    agent_uuid: str


class ChatResponse(BaseModel):
    uuid: str
    agent_uuid: str
    agent_name: str
    title: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    uuid: str
    role: str
    content: str | None
    status: str
    created_at: str

    model_config = {"from_attributes": True}


class MessageSendRequest(BaseModel):
    content: str


class MessageSendResponse(BaseModel):
    message_uuid: str
    status: str
