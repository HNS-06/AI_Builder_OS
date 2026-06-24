import asyncio
import json
import structlog
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.services.supabase import get_project
from app.services.streaming import register_client, unregister_client

logger = structlog.get_logger()
router = APIRouter(prefix="/api", tags=["stream"])


@router.get("/stream/{project_id}")
async def stream_project(project_id: str, request: Request):
    user_id = request.state.user_id
    project = await get_project(project_id, user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    queue = register_client(project_id)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break

                if not queue.empty():
                    data = await queue.get()
                    yield data

                    parsed = json.loads(data.split("data: ", 1)[1].split("\n\n")[0])
                    if parsed.get("done") and parsed.get("agent") == "investor":
                        break
                else:
                    await asyncio.sleep(0.3)

        except asyncio.CancelledError:
            pass
        finally:
            unregister_client(project_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
