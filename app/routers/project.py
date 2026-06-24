import structlog
from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import ProjectResponse, ProjectListItem, AgentOutput, AgentName, AgentStatus
from app.services.supabase import get_project, get_project_agents, list_user_projects, delete_project

logger = structlog.get_logger()
router = APIRouter(prefix="/api", tags=["project"])


@router.get("/project/{project_id}", response_model=ProjectResponse)
async def get_project_detail(project_id: str, request: Request):
    user_id = request.state.user_id
    project = await get_project(project_id, user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    agents_data = await get_project_agents(project_id)
    agents = [
        AgentOutput(
            name=AgentName(a["agent_name"]),
            status=AgentStatus(a["status"]),
            output=a.get("output", ""),
            completed_at=a.get("completed_at"),
        )
        for a in agents_data
    ]

    return ProjectResponse(
        id=project["id"],
        idea=project["idea"],
        status=project["status"],
        created_at=project["created_at"],
        agents=agents,
    )


@router.get("/projects", response_model=list[ProjectListItem])
async def list_projects(request: Request):
    user_id = request.state.user_id
    projects = await list_user_projects(user_id)
    return [
        ProjectListItem(
            id=p["id"],
            idea=p["idea"],
            created_at=p["created_at"],
            status=p["status"],
        )
        for p in projects
    ]


@router.delete("/project/{project_id}")
async def delete_project_endpoint(project_id: str, request: Request):
    user_id = request.state.user_id
    deleted = await delete_project(project_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"detail": "Project deleted"}
