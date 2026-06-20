from pathlib import Path

import aiofiles

from app.core.config import settings
from app.storage.base import StorageAdapter


class LocalStorageAdapter(StorageAdapter):
    def __init__(self) -> None:
        self.base_path = Path(settings.storage_local_base_path)

    def _resolve(self, file_path: str) -> Path:
        full_path = self.base_path / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        return full_path

    async def upload(self, file_path: str, content: bytes) -> str:
        path = self._resolve(file_path)
        async with aiofiles.open(path, "wb") as f:
            await f.write(content)
        return str(path)

    async def download(self, file_path: str) -> bytes:
        path = self._resolve(file_path)
        async with aiofiles.open(path, "rb") as f:
            return await f.read()

    async def delete(self, file_path: str) -> None:
        path = self._resolve(file_path)
        if path.exists():
            path.unlink()

    async def exists(self, file_path: str) -> bool:
        path = self._resolve(file_path)
        return path.exists()
