import asyncio
import json
import structlog
from app.models.schemas import SSEChunk, AgentName

logger = structlog.get_logger()

_project_queues: dict[str, list[asyncio.Queue]] = {}


def register_client(project_id: str) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue()
    _project_queues.setdefault(project_id, []).append(q)
    logger.info("sse_client_connected", project_id=project_id, total=len(_project_queues.get(project_id, [])))
    return q


def unregister_client(project_id: str, queue: asyncio.Queue) -> None:
    if project_id in _project_queues:
        try:
            _project_queues[project_id].remove(queue)
        except ValueError:
            pass
        if not _project_queues[project_id]:
            del _project_queues[project_id]
    logger.info("sse_client_disconnected", project_id=project_id)


async def push_chunk(project_id: str, agent: AgentName, chunk: str, done: bool) -> None:
    payload = SSEChunk(agent=agent, chunk=chunk, done=done).model_dump_json()
    raw = f"data: {payload}\n\n"
    for q in _project_queues.get(project_id, []):
        try:
            await q.put(raw)
        except Exception:
            pass
