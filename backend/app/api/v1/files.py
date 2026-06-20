from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.file import FileResponse
from app.services import file_service

router = APIRouter(prefix="/files", tags=["files"])


@router.get("", response_model=list[FileResponse])
async def list_files(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    files = await file_service.get_user_files(db, current_user)
    return [
        FileResponse(
            uuid=f.uuid,
            filename=f.filename,
            original_name=f.original_name,
            mime_type=f.mime_type,
            size=f.size,
            created_at=f.created_at.isoformat(),
        )
        for f in files
    ]


@router.get("/{file_uuid}")
async def get_file(
    file_uuid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_meta = await file_service.get_file_by_uuid(db, file_uuid)
    if file_meta is None or file_meta.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    content = await file_service.storage.download(file_meta.storage_path)

    original_name = file_meta.original_name
    ascii_name = original_name.encode("latin-1", "ignore").decode("latin-1") or "file"
    encoded_name = quote(original_name, safe="")
    content_disposition = (
        f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{encoded_name}"
    )

    return StreamingResponse(
        iter([content]),
        media_type=file_meta.mime_type or "application/octet-stream",
        headers={"Content-Disposition": content_disposition},
    )


@router.put("/{file_uuid}", response_model=FileResponse)
async def upload_file(
    file_uuid: str,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    filename = file.filename or "untitled"
    file_meta = await file_service.upsert_file(
        db,
        current_user,
        file_uuid,
        filename=filename,
        original_name=filename,
        mime_type=file.content_type,
        content=content,
    )
    return FileResponse(
        uuid=file_meta.uuid,
        filename=file_meta.filename,
        original_name=file_meta.original_name,
        mime_type=file_meta.mime_type,
        size=file_meta.size,
        created_at=file_meta.created_at.isoformat(),
    )


@router.delete("/{file_uuid}")
async def delete_file(
    file_uuid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_meta = await file_service.get_file_by_uuid(db, file_uuid)
    if file_meta is None or file_meta.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    await file_service.delete_file(db, file_meta)
    return {"message": "File deleted"}
