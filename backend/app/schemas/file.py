from pydantic import BaseModel


class FileResponse(BaseModel):
    uuid: str
    filename: str
    original_name: str
    mime_type: str | None
    size: int
    created_at: str

    model_config = {"from_attributes": True}
