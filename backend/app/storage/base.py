from abc import ABC, abstractmethod


class StorageAdapter(ABC):
    @abstractmethod
    async def upload(self, file_path: str, content: bytes) -> str: ...

    @abstractmethod
    async def download(self, file_path: str) -> bytes: ...

    @abstractmethod
    async def delete(self, file_path: str) -> None: ...

    @abstractmethod
    async def exists(self, file_path: str) -> bool: ...
