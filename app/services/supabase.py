import structlog
from supabase import create_client, Client
from app.config import get_settings

logger = structlog.get_logger()

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


async def create_project(user_id: str, idea: str, domain: str = "") -> dict:
    sb = get_supabase()
    result = sb.table("projects").insert({
        "user_id": user_id,
        "idea": idea,
        "domain": domain,
        "status": "processing",
    }).execute()
    logger.info("project_created", project_id=result.data[0]["id"], user_id=user_id)
    return result.data[0]


async def get_project(project_id: str, user_id: str) -> dict | None:
    sb = get_supabase()
    result = sb.table("projects").select("*").eq("id", project_id).eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


async def get_project_agents(project_id: str) -> list[dict]:
    sb = get_supabase()
    result = sb.table("agent_outputs").select("*").eq("project_id", project_id).order("id").execute()
    return result.data


async def update_project_status(project_id: str, status: str) -> None:
    sb = get_supabase()
    sb.table("projects").update({"status": status}).eq("id", project_id).execute()
    logger.info("project_status_updated", project_id=project_id, status=status)


async def list_user_projects(user_id: str, limit: int = 50) -> list[dict]:
    sb = get_supabase()
    result = (
        sb.table("projects")
        .select("id, idea, created_at, status")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


async def create_agent_output(project_id: str, agent_name: str) -> dict:
    sb = get_supabase()
    result = sb.table("agent_outputs").insert({
        "project_id": project_id,
        "agent_name": agent_name,
        "status": "running",
    }).execute()
    return result.data[0]


async def update_agent_output(
    project_id: str, agent_name: str, output: str, status: str = "done"
) -> None:
    sb = get_supabase()
    from datetime import datetime, timezone
    update = {"output": output, "status": status}
    if status == "done":
        update["completed_at"] = datetime.now(timezone.utc).isoformat()
    sb.table("agent_outputs").update(update).eq("project_id", project_id).eq("agent_name", agent_name).execute()


async def set_agent_error(project_id: str, agent_name: str, error_msg: str) -> None:
    sb = get_supabase()
    from datetime import datetime, timezone
    sb.table("agent_outputs").update({
        "output": error_msg,
        "status": "error",
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("project_id", project_id).eq("agent_name", agent_name).execute()


async def delete_project(project_id: str, user_id: str) -> bool:
    sb = get_supabase()
    result = sb.table("projects").delete().eq("id", project_id).eq("user_id", user_id).execute()
    logger.info("project_deleted", project_id=project_id, user_id=user_id)
    return len(result.data) > 0


async def count_user_active_generations(user_id: str) -> int:
    sb = get_supabase()
    result = (
        sb.table("projects")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("status", "processing")
        .execute()
    )
    return result.count or 0
