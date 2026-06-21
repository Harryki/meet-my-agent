import asyncio
import os
import sys
import uuid

from openai import AsyncOpenAI

# Add the backend directory to python path so we can import from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.rag_service import RAGService
from app.core.config import settings

async def main():
    agent_uuid = str(uuid.uuid4())
    file_uuid = str(uuid.uuid4())
    rag = RAGService()
    
    print("========================================")
    print("=== Test 1: File Vectorization       ===")
    print("========================================")
    content = "내 강아지 이름은 뽀삐입니다. 뽀삐는 하늘을 나는 우주선을 타고 다닙니다."
    filename = "뽀삐.md"
    
    print(f"[Info] Processing file: {filename}")
    num_chunks = await rag.process_file(file_uuid, agent_uuid, content, filename)
    print(f"[Result] Vectorized into {num_chunks} chunks.")
    if num_chunks == 0:
        print("❌ FAIL: No chunks created.")
        return
    else:
        print("✅ PASS: Vectorization successful.\n")

    print("========================================")
    print("=== Test 2: RAG Search               ===")
    print("========================================")
    query = "강아지 이름"
    print(f"[Info] Query: {query}")
    results = await rag.search(agent_uuid, query, top_k=3)
    if results:
        print(f"✅ PASS: Found {len(results)} chunks.")
        for r in results:
            print(f" - Score: {r['score']:.3f} | Text: {r['text']}")
    else:
        print("❌ FAIL: No chunks found.")
    
    print("\n========================================")
    print("=== Test 3: LLM Integration          ===")
    print("========================================")
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    search_tool = {
        "type": "function",
        "function": {
            "name": "search_knowledge_base",
            "description": "Search the provider's knowledge base (.md files) for relevant information. Use this when you need specific information to answer the user's question.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query"},
                    "top_k": {"type": "integer", "description": "Number of chunks", "default": 3},
                },
                "required": ["query"],
            },
        },
    }
    
    query_llm = "내 강아지 이름이 뭐야? 걔는 뭘 타고 다녀?"
    rag_instruction = (
        "You are a helpful AI assistant. You have access to a knowledge base containing the user's personal files. "
        "You MUST use the `search_knowledge_base` tool to search for ANY specific facts, names, or personal details. "
        "DO NOT refuse to answer personal questions. ALWAYS assume the answer is in the knowledge base and search for it first."
    )
    messages = [
        {"role": "system", "content": rag_instruction},
        {"role": "user", "content": query_llm}
    ]
    
    print(f"[Info] User asks: '{query_llm}'")
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=[search_tool],
        tool_choice="auto"
    )
    
    message = response.choices[0].message
    if message.tool_calls:
        print("✅ PASS: LLM decided to use search_knowledge_base tool.")
        messages.append(message)
        for tc in message.tool_calls:
            print(f"   [Tool Call] {tc.function.name} -> {tc.function.arguments}")
            
            import json
            args = json.loads(tc.function.arguments)
            chunks = await rag.search(agent_uuid, args.get("query", ""), args.get("top_k", 3))
            context_str = "\n".join(f"[{c['filename']}]: {c['text']}" for c in chunks)
            
            print(f"   [Tool Result] Provided {len(chunks)} chunk(s) to LLM.")
            
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": context_str or "No relevant documents found."
            })
            
        resp2 = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages
        )
        print(f"✅ [Final Answer]: {resp2.choices[0].message.content}")
            
    else:
        print(f"❌ FAIL: LLM did not use tool. Answered: {message.content}")
        
    print("\n========================================")
    print("=== Test 4: Irrelevant Question      ===")
    print("========================================")
    query_irr = "안드로메다 은하의 나이는?"
    messages_irr = [
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": query_irr}
    ]
    
    print(f"[Info] User asks: '{query_irr}'")
    response_irr = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages_irr,
        tools=[search_tool],
        tool_choice="auto"
    )
    
    msg_irr = response_irr.choices[0].message
    if msg_irr.tool_calls:
        print("⚠️ LLM decided to search. (It's okay, maybe it wants to be sure)")
        messages_irr.append(msg_irr)
        for tc in msg_irr.tool_calls:
            import json
            args = json.loads(tc.function.arguments)
            chunks = await rag.search(agent_uuid, args.get("query", ""), args.get("top_k", 3))
            context_str = "\n".join(c["text"] for c in chunks)
            print(f"   [Tool Result] Found {len(chunks)} chunk(s). Content: '{context_str}'")
            
            messages_irr.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": context_str or "No relevant documents found."
            })
        resp3 = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages_irr
        )
        print(f"✅ [Final Answer]: {resp3.choices[0].message.content}")
    else:
        print("✅ PASS: LLM answered directly without searching.")
        print(f"   [Final Answer]: {msg_irr.content}")

    # Cleanup
    await rag.delete_file_chunks(file_uuid)
    print("\n[Info] Cleanup complete.")

if __name__ == "__main__":
    asyncio.run(main())
