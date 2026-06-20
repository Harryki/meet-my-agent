import asyncio
import json
from datetime import UTC, datetime

import numpy as np
from openai import AsyncOpenAI
from redis.asyncio import Redis

from app.core.config import settings

CHUNK_SEPARATORS = ["\n## ", "\n### ", "\n\n", ". ", "\n"]


def _get_openai() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=settings.openai_api_key)


def chunk_markdown(text: str, max_chunk_size: int = 1000, overlap: int = 100) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        if len(text) - start <= max_chunk_size:
            chunks.append(text[start:])
            break
        end = start + max_chunk_size
        best_split = -1
        for sep in CHUNK_SEPARATORS:
            pos = text.rfind(sep, start + max(1, max_chunk_size // 2), end)
            if pos > best_split:
                best_split = pos
        if best_split == -1:
            best_split = end
        chunks.append(text[start:best_split])
        start = best_split - overlap
    return chunks


async def generate_embedding(text: str) -> list[float]:
    client = _get_openai()
    resp = await client.embeddings.create(model="text-embedding-3-small", input=text)
    return resp.data[0].embedding


class RAGService:
    def __init__(self, redis: Redis | None = None) -> None:
        self._redis = redis

    async def _get_redis(self) -> Redis:
        if self._redis is None:
            self._redis = await Redis.from_url(settings.redis_url, decode_responses=True)
        return self._redis

    async def process_file(
        self, file_uuid: str, agent_uuid: str, content: str, filename: str
    ) -> int:
        redis = await self._get_redis()
        chunks = chunk_markdown(content)
        embeddings = await asyncio.gather(*[generate_embedding(c) for c in chunks])

        pipeline = redis.pipeline()
        chunk_ids = []
        for i, (chunk_text, emb) in enumerate(zip(chunks, embeddings, strict=False)):
            chunk_id = f"{file_uuid}:{i}"
            chunk_ids.append(chunk_id)
            pipeline.hset(
                f"agent:{agent_uuid}:chunks:{chunk_id}",
                mapping={
                    "text": chunk_text,
                    "embedding": json.dumps(emb),
                    "file_uuid": file_uuid,
                    "filename": filename,
                    "created_at": datetime.now(UTC).isoformat(),
                },
            )
        pipeline.sadd(f"agent:{agent_uuid}:chunk_ids", *chunk_ids)
        pipeline.sadd(f"file:{file_uuid}:chunk_ids", *chunk_ids)
        await pipeline.execute()
        return len(chunks)

    async def search(self, agent_uuid: str, query: str, top_k: int = 3) -> list[dict]:
        redis = await self._get_redis()
        query_emb = await generate_embedding(query)
        query_vec = np.array(query_emb, dtype=np.float32)

        chunk_ids = await redis.smembers(f"agent:{agent_uuid}:chunk_ids")
        if not chunk_ids:
            return []

        pipeline = redis.pipeline()
        for cid in chunk_ids:
            pipeline.hgetall(f"agent:{agent_uuid}:chunks:{cid}")
        results = await pipeline.execute()

        scored = []
        for chunk_data in results:
            if not chunk_data:
                continue
            emb = np.array(json.loads(chunk_data["embedding"]), dtype=np.float32)
            score = float(
                np.dot(query_vec, emb) / (np.linalg.norm(query_vec) * np.linalg.norm(emb))
            )
            scored.append(
                {
                    "text": chunk_data["text"],
                    "file_uuid": chunk_data["file_uuid"],
                    "filename": chunk_data.get("filename", ""),
                    "score": score,
                }
            )

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    async def delete_file_chunks(self, file_uuid: str) -> None:
        redis = await self._get_redis()
        chunk_ids = await redis.smembers(f"file:{file_uuid}:chunk_ids")
        if not chunk_ids:
            return

        agent_uuid = None
        pipeline = redis.pipeline()
        for cid in chunk_ids:
            key = None
            async for k in redis.scan_iter(match=f"agent:*:chunks:{cid}"):
                key = k
                parts = k.split(":")
                agent_uuid = parts[1]
                break
            if key:
                pipeline.delete(key)
        if agent_uuid and chunk_ids:
            pipeline.srem(f"agent:{agent_uuid}:chunk_ids", *chunk_ids)
        pipeline.delete(f"file:{file_uuid}:chunk_ids")
        await pipeline.execute()
