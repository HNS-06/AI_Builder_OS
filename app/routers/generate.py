import asyncio
import structlog
from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import GenerateRequest, GenerateResponse
from app.services.supabase import create_project, count_user_active_generations
from app.agents.orchestrator import run_pipeline
from app.config import get_settings

logger = structlog.get_logger()
router = APIRouter(prefix="/api", tags=["generate"])


@router.post("/generate", response_model=GenerateResponse)
async def generate_project(body: GenerateRequest, request: Request):
    user_id = request.state.user_id
    settings = get_settings()

    active = await count_user_active_generations(user_id)
    if active >= settings.max_concurrent_generations:
        raise HTTPException(
            status_code=429,
            detail=f"Maximum {settings.max_concurrent_generations} concurrent generations reached. Wait for existing projects to complete.",
        )

    project = await create_project(user_id=user_id, idea=body.idea)
    project_id = project["id"]

    asyncio.create_task(run_pipeline(project_id, body.idea))

    logger.info("generate_triggered", project_id=project_id, user_id=user_id)
    return GenerateResponse(project_id=project_id, status="processing")
