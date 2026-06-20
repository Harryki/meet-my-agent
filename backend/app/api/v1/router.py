from fastapi import APIRouter

from app.api.v1.agents import router as agents_router
from app.api.v1.auth import router as auth_router
from app.api.v1.chats import router as chats_router
from app.api.v1.files import router as files_router

router = APIRouter(prefix="/v1")
router.include_router(auth_router)
router.include_router(agents_router)
router.include_router(files_router)
router.include_router(chats_router)
