from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import FileMetadata
from app.models.user import User
from app.storage.local import LocalStorageAdapter

storage = LocalStorageAdapter()


async def get_user_files(db: AsyncSession, user: User) -> list[FileMetadata]:
    result = await db.execute(
        select(FileMetadata)
        .where(FileMetadata.user_id == user.id)
        .order_by(FileMetadata.created_at.desc())
    )
    return list(result.scalars().all())


async def get_file_by_uuid(db: AsyncSession, file_uuid: str) -> FileMetadata | None:
    result = await db.execute(select(FileMetadata).where(FileMetadata.uuid == file_uuid))
    return result.scalar_one_or_none()


async def upsert_file(
    db: AsyncSession,
    user: User,
    file_uuid: str,
    filename: str,
    original_name: str,
    mime_type: str | None,
    content: bytes,
) -> FileMetadata:
    existing = await db.execute(select(FileMetadata).where(FileMetadata.uuid == file_uuid))
    file_meta = existing.scalar_one_or_none()

    storage_path = f"{user.uuid}/{file_uuid}_{filename}"
    await storage.upload(storage_path, content)

    if file_meta:
        file_meta.filename = filename
        file_meta.original_name = original_name
        file_meta.mime_type = mime_type
        file_meta.size = len(content)
        file_meta.storage_path = storage_path
    else:
        file_meta = FileMetadata(
            uuid=file_uuid,
            user_id=user.id,
            filename=filename,
            original_name=original_name,
            mime_type=mime_type,
            size=len(content),
            storage_path=storage_path,
        )
        db.add(file_meta)

    await db.commit()
    await db.refresh(file_meta)

    from app.models.agent import Agent
    from app.services.rag_service import RAGService
    agent_result = await db.execute(select(Agent).where(Agent.user_id == user.id))
    agent = agent_result.scalar_one_or_none()

    if agent:
        rag = RAGService()
        if file_meta:
            await rag.delete_file_chunks(file_meta.uuid)
        text_content = content.decode("utf-8", errors="ignore")
        await rag.process_file(file_uuid, agent.uuid, text_content, filename)

    return file_meta


async def delete_file(db: AsyncSession, file_meta: FileMetadata) -> None:
    from app.services.rag_service import RAGService
    rag = RAGService()
    await rag.delete_file_chunks(file_meta.uuid)

    await storage.delete(file_meta.storage_path)
    await db.delete(file_meta)
    await db.commit()
