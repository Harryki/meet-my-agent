import asyncio
import json
import os

import redis as sync_redis
from openai import AsyncOpenAI

os.environ["PYTHONASYNCIOEVENTLOOP"] = "uvloop"

from app.core.config import settings  # noqa: E402

redis_client = sync_redis.Redis.from_url(settings.redis_url, decode_responses=True)


def process_chat_message(chat_uuid: str, message_uuid: str, user_uuid: str) -> None:
    asyncio.run(_process(chat_uuid, message_uuid, user_uuid))


async def _process(chat_uuid: str, message_uuid: str, user_uuid: str) -> None:
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

    from app.models.agent import Agent
    from app.models.user import User
    from app.models.file import FileMetadata
    from app.models.chat import Chat
    from app.models.message import Message, MessageStatus
    from app.services.rag_service import RAGService

    channel = f"stream:{message_uuid}"

    def publish(event_type: str, data: dict) -> None:
        redis_client.publish(channel, json.dumps({"type": event_type, **data}))

    try:
        engine = create_async_engine(settings.database_url)
        session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with session_factory() as db:
            chat_result = await db.execute(select(Chat).where(Chat.uuid == chat_uuid))
            chat = chat_result.scalar_one_or_none()
            if chat is None:
                publish("error", {"message": "Chat not found"})
                publish("done", {"message_uuid": message_uuid, "token_count": 0})
                return

            agent = await db.get(Agent, chat.agent_id)
            if agent is None:
                publish("error", {"message": "Agent not found"})
                publish("done", {"message_uuid": message_uuid, "token_count": 0})
                return

            msg_result = await db.execute(select(Message).where(Message.uuid == message_uuid))
            assistant_msg = msg_result.scalar_one_or_none()
            if assistant_msg is None:
                publish("error", {"message": "Message not found"})
                publish("done", {"message_uuid": message_uuid, "token_count": 0})
                return

            msgs_result = await db.execute(
                select(Message)
                .where(Message.chat_id == chat.id, Message.status == MessageStatus.completed)
                .order_by(Message.created_at)
            )
            history = msgs_result.scalars().all()

            files_result = await db.execute(select(FileMetadata).where(FileMetadata.user_id == agent.user_id))
            agent_files = files_result.scalars().all()
            file_names = [f.original_name for f in agent_files]
            file_list_str = ", ".join(file_names) if file_names else "None"

            base_prompt = agent.system_prompt or "You are a helpful assistant."
            rag_instruction = (
                f"\n\nIMPORTANT: You have access to a knowledge base containing the user's personal files. "
                f"Currently available files: [{file_list_str}]. "
                "You MUST use the `search_knowledge_base` tool to search for ANY specific facts, names, or personal details. "
                "DO NOT refuse to answer personal questions. ALWAYS assume the answer is in the knowledge base and search for it first. "
                "If the user asks 'what do you know', 'what can you answer', or similar questions, use the list of available files to suggest "
                "specific questions they could ask you based on what those files likely contain."
            )
            messages = [
                {"role": "system", "content": base_prompt + rag_instruction}
            ]

            for m in history:
                messages.append({"role": m.role.value, "content": m.content or ""})

            publish("status", {"status": "analyzing"})

            client = AsyncOpenAI(api_key=settings.openai_api_key)

            search_tool = {
                "type": "function",
                "function": {
                    "name": "search_knowledge_base",
                    "description": (
                        "Search the provider's knowledge base (.md files) "
                        "for relevant information. Use this when you need "
                        "specific information to answer the user's question."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query to find relevant documents",
                            },
                            "top_k": {
                                "type": "integer",
                                "description": "Number of relevant chunks to retrieve",
                                "default": 3,
                            },
                        },
                        "required": ["query"],
                    },
                },
            }

            publish("status", {"status": "calling_llm"})

            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                tools=[search_tool],
                tool_choice="auto",
                stream=True,
            )

            tool_calls = {}
            final_content = ""
            finish_reason = None

            async for chunk in response:
                delta = chunk.choices[0].delta if chunk.choices else None
                finish_reason = chunk.choices[0].finish_reason if chunk.choices else None

                if delta and delta.tool_calls:
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in tool_calls:
                            tool_calls[idx] = {
                                "id": tc.id or "",
                                "function": {"name": "", "arguments": ""},
                            }
                        if tc.id:
                            tool_calls[idx]["id"] += tc.id
                        if tc.function:
                            if tc.function.name:
                                tool_calls[idx]["function"]["name"] += tc.function.name
                            if tc.function.arguments:
                                tool_calls[idx]["function"]["arguments"] += tc.function.arguments

                if delta and delta.content:
                    final_content += delta.content
                    publish("token", {"token": delta.content})

            if finish_reason == "tool_calls" and tool_calls:
                publish("status", {"status": "searching_documents"})

                rag = RAGService()

                for idx, tc_data in tool_calls.items():
                    try:
                        args = json.loads(tc_data["function"]["arguments"])
                    except json.JSONDecodeError:
                        args = {"query": "", "top_k": 3}

                    publish(
                        "tool_call",
                        {
                            "tool": tc_data["function"]["name"],
                            "arguments": args,
                        },
                    )

                    chunks = await rag.search(agent.uuid, args.get("query", ""), args.get("top_k", 3))

                    publish(
                        "tool_result",
                        {
                            "tool": "search_knowledge_base",
                            "chunks_count": len(chunks),
                            "files": list(set(c["filename"] for c in chunks)),
                        },
                    )

                    context_str = "\n\n".join(
                        f"[{c['filename']}] (score: {c['score']:.3f}):\n{c['text']}" for c in chunks
                    )

                    messages.append(
                        {
                            "role": "assistant",
                            "tool_calls": [
                                {
                                    "id": tc_data["id"],
                                    "type": "function",
                                    "function": {
                                        "name": tc_data["function"]["name"],
                                        "arguments": tc_data["function"]["arguments"],
                                    },
                                }
                            ],
                        }
                    )
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tc_data["id"],
                            "content": context_str or "No relevant documents found.",
                        }
                    )

                publish("status", {"status": "generating_response"})

                response2 = await client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages,
                    stream=True,
                )

                final_content = ""
                async for chunk in response2:
                    delta = chunk.choices[0].delta if chunk.choices else None
                    if delta and delta.content:
                        final_content += delta.content
                        publish("token", {"token": delta.content})

            assistant_msg.content = final_content
            assistant_msg.status = MessageStatus.completed
            await db.commit()

            publish(
                "done",
                {
                    "message_uuid": message_uuid,
                    "token_count": len(final_content),
                },
            )
    except Exception as e:
        import traceback
        traceback.print_exc()
        publish("error", {"message": str(e)})
        publish("done", {"message_uuid": message_uuid, "token_count": 0})
