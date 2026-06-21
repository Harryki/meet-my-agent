import asyncio
import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from openai import AsyncOpenAI
from app.core.config import settings
from app.models.agent import Agent
from app.models.user import User
from app.models.file import FileMetadata
from app.models.chat import Chat
from app.models.message import Message

async def main():
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    # Simulate files that the agent has access to
    file_list_str = "뽀삐.md, secret_recipe.md, 2024_tax_returns.md"

    print("========================================")
    print("=== Test: LLM Suggesting Questions   ===")
    print("========================================")
    print(f"[Info] Simulated available files: {file_list_str}")

    base_prompt = "You are a helpful assistant."
    rag_instruction = (
        f"\n\nIMPORTANT: You have access to a knowledge base containing the user's personal files. "
        f"Currently available files: [{file_list_str}]. "
        "You MUST use the `search_knowledge_base` tool to search for ANY specific facts, names, or personal details. "
        "DO NOT refuse to answer personal questions. ALWAYS assume the answer is in the knowledge base and search for it first. "
        "If the user asks 'what do you know', 'what can you answer', or similar questions, use the list of available files to suggest "
        "specific questions they could ask you based on what those files likely contain."
    )

    messages = [
        {"role": "system", "content": base_prompt + rag_instruction},
        {"role": "user", "content": "What do you know?"}
    ]

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    print("[Info] Sending 'What do you know?' to LLM...")
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        stream=False,
    )

    answer = response.choices[0].message.content
    print("\n[Result] LLM Output:")
    print(answer)

    # Check if the output suggests questions based on the files
    file_names = ["뽀삐.md", "secret_recipe.md", "2024_tax_returns.md"]
    if any(f.replace('.md', '').lower() in answer.lower() for f in file_names):
        print("\n✅ PASS: LLM suggested questions using file names!")
    else:
        print("\n❌ FAIL: LLM output doesn't seem to mention the file names.")

if __name__ == "__main__":
    asyncio.run(main())
