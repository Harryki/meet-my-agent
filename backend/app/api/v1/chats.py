import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.agent import Agent
from app.models.chat import Chat
from app.models.message import Message, MessageRole, MessageStatus
from app.models.user import User
from app.schemas.chat import (
    ChatCreateRequest,
    ChatResponse,
    MessageResponse,
    MessageSendRequest,
    MessageSendResponse,
)

router = APIRouter(prefix="/chats", tags=["chats"])


@router.get("", response_model=list[ChatResponse])
async def list_chats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Chat)
        .where(Chat.consumer_id == current_user.id, Chat.is_deleted == False)  # noqa: E712
        .order_by(Chat.updated_at.desc())
    )
    chats = result.scalars().all()
    return [
        ChatResponse(
            uuid=c.uuid,
            agent_uuid=c.agent.uuid,
            agent_name=c.agent.name,
            title=c.title,
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat(),
        )
        for c in chats
    ]


@router.post("", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    body: ChatCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent_result = await db.execute(select(Agent).where(Agent.uuid == body.agent_uuid))
    agent = agent_result.scalar_one_or_none()
    if agent is None or not agent.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    chat = Chat(
        consumer_id=current_user.id,
        agent_id=agent.id,
        title=f"Chat with {agent.name}",
    )
    db.add(chat)
    await db.commit()
    await db.refresh(chat)

    return ChatResponse(
        uuid=chat.uuid,
        agent_uuid=agent.uuid,
        agent_name=agent.name,
        title=chat.title,
        created_at=chat.created_at.isoformat(),
        updated_at=chat.updated_at.isoformat(),
    )


@router.get("/{chat_uuid}", response_model=list[MessageResponse])
async def get_chat_messages(
    chat_uuid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chat = await _get_chat(db, chat_uuid, current_user)
    return [
        MessageResponse(
            uuid=m.uuid,
            role=m.role.value,
            content=m.content,
            status=m.status.value,
            created_at=m.created_at.isoformat(),
        )
        for m in chat.messages
    ]


@router.post(
    "/{chat_uuid}/messages",
    response_model=MessageSendResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def send_message(
    chat_uuid: str,
    body: MessageSendRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chat = await _get_chat(db, chat_uuid, current_user)

    user_msg = Message(
        chat_id=chat.id,
        role=MessageRole.user,
        content=body.content,
        status=MessageStatus.completed,
    )
    db.add(user_msg)
    await db.flush()

    assistant_msg = Message(
        chat_id=chat.id,
        role=MessageRole.assistant,
        status=MessageStatus.pending,
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    import redis as sync_redis
    sync_client = sync_redis.Redis.from_url(settings.redis_url)
    from rq import Queue

    q = Queue("agent", connection=sync_client)
    q.enqueue("worker.main.process_chat_message", chat.uuid, assistant_msg.uuid, current_user.uuid)

    return MessageSendResponse(
        message_uuid=assistant_msg.uuid,
        status=MessageStatus.pending.value,
    )


@router.get("/{chat_uuid}/messages/{message_uuid}/stream")
async def stream_message(
    chat_uuid: str,
    message_uuid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chat = await _get_chat(db, chat_uuid, current_user)

    msg_result = await db.execute(
        select(Message).where(Message.uuid == message_uuid, Message.chat_id == chat.id)
    )
    msg = msg_result.scalar_one_or_none()
    if msg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    if msg.status == MessageStatus.completed:

        async def done_gen():
            yield {
                "event": "token",
                "data": json.dumps({"type": "token", "token": msg.content or ""}),
            }
            yield {
                "event": "done",
                "data": json.dumps({"type": "done", "message_uuid": message_uuid}),
            }

        return EventSourceResponse(done_gen())

    redis_client = await Redis.from_url(settings.redis_url, decode_responses=True)

    async def event_generator():
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(f"stream:{message_uuid}")

        import asyncio
        while True:
            try:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message is not None:
                    data = json.loads(message["data"])
                    event_type = data.get("type")
                    yield {"event": event_type, "data": json.dumps(data)}
                    if event_type in ("done", "error"):
                        break
                await asyncio.sleep(0.01)
            except Exception as e:
                # Handle timeout or redis disconnection gracefully
                from redis.exceptions import TimeoutError
                if isinstance(e, TimeoutError):
                    continue
                break

        await pubsub.unsubscribe(f"stream:{message_uuid}")
        await pubsub.close()

    return EventSourceResponse(event_generator())


async def _get_chat(db: AsyncSession, chat_uuid: str, user: User) -> Chat:
    result = await db.execute(
        select(Chat).where(Chat.uuid == chat_uuid, Chat.is_deleted == False)  # noqa: E712
    )
    chat = result.scalar_one_or_none()
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    if chat.consumer_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return chat


@router.delete("/{chat_uuid}")
async def delete_chat(
    chat_uuid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chat = await _get_chat(db, chat_uuid, current_user)
    chat.is_deleted = True
    await db.commit()
    return {"message": "Chat deleted"}
