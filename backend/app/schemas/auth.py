from pydantic import BaseModel
from .agent import AgentResponse

class GoogleRegisterRequest(BaseModel):
    code: str
    name: str
    email: str
    avatar_url: str | None = None


class LoginRequest(BaseModel):
    code: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    uuid: str
    email: str
    name: str
    avatar_url: str | None
    role: str
    agent: AgentResponse | None = None

    model_config = {"from_attributes": True}
