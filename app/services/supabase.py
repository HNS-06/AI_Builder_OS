import structlog
from datetime import datetime, timezone
from uuid import uuid4
from app.config import get_settings

logger = structlog.get_logger()

# ---------------------------------------------------------------------------
# Persistent file-based store used when DEMO_MODE=true (no Supabase needed)
# ---------------------------------------------------------------------------
import json
import os

DB_FILE = ".demo_db.json"

_demo_projects: dict[str, dict] = {}
_demo_agents: dict[str, list[dict]] = {}

def _load_demo_db():
    global _demo_projects, _demo_agents
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                _demo_projects = data.get("projects", {})
                _demo_agents = data.get("agents", {})
                logger.info("demo_db_loaded", projects=len(_demo_projects))
        except Exception as e:
            logger.error("failed_to_load_demo_db", error=str(e))

def _save_demo_db():
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "projects": _demo_projects,
                "agents": _demo_agents
            }, f, indent=2)
    except Exception as e:
        logger.error("failed_to_save_demo_db", error=str(e))

# Load database on startup
_load_demo_db()


def _is_demo() -> bool:
    return get_settings().demo_mode


# ---------------------------------------------------------------------------
# Supabase client (only used when not in demo mode)
# ---------------------------------------------------------------------------
_client = None


def get_supabase():
    global _client
    if _client is None:
        from supabase import create_client, Client
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

async def create_project(user_id: str, idea: str, domain: str = "") -> dict:
    if _is_demo():
        project_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        project = {
            "id": project_id,
            "user_id": user_id,
            "idea": idea,
            "domain": domain,
            "status": "processing",
            "created_at": now,
        }
        _demo_projects[project_id] = project
        _demo_agents[project_id] = []
        logger.info("demo_project_created", project_id=project_id)
        _save_demo_db()
        return project

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
    if _is_demo():
        p = _demo_projects.get(project_id)
        if p and p["user_id"] == user_id:
            return p
        return None

    sb = get_supabase()
    result = sb.table("projects").select("*").eq("id", project_id).eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


async def get_project_agents(project_id: str) -> list[dict]:
    if _is_demo():
        return _demo_agents.get(project_id, [])

    sb = get_supabase()
    result = sb.table("agent_outputs").select("*").eq("project_id", project_id).order("id").execute()
    return result.data


async def update_project_status(project_id: str, status: str) -> None:
    if _is_demo():
        if project_id in _demo_projects:
            _demo_projects[project_id]["status"] = status
        logger.info("demo_project_status_updated", project_id=project_id, status=status)
        _save_demo_db()
        return

    sb = get_supabase()
    sb.table("projects").update({"status": status}).eq("id", project_id).execute()
    logger.info("project_status_updated", project_id=project_id, status=status)


async def list_user_projects(user_id: str, limit: int = 50) -> list[dict]:
    if _is_demo():
        projects = [
            p for p in _demo_projects.values() if p["user_id"] == user_id
        ]
        projects.sort(key=lambda p: p.get("created_at", ""), reverse=True)
        return [
            {"id": p["id"], "idea": p["idea"], "created_at": p["created_at"], "status": p["status"]}
            for p in projects[:limit]
        ]

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
    if _is_demo():
        entry = {
            "project_id": project_id,
            "agent_name": agent_name,
            "status": "running",
            "output": "",
            "completed_at": None,
        }
        _demo_agents.setdefault(project_id, []).append(entry)
        _save_demo_db()
        return entry

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
    if _is_demo():
        for a in _demo_agents.get(project_id, []):
            if a["agent_name"] == agent_name:
                a["output"] = output
                a["status"] = status
                if status == "done":
                    a["completed_at"] = datetime.now(timezone.utc).isoformat()
                break
        _save_demo_db()
        return

    sb = get_supabase()
    update = {"output": output, "status": status}
    if status == "done":
        update["completed_at"] = datetime.now(timezone.utc).isoformat()
    sb.table("agent_outputs").update(update).eq("project_id", project_id).eq("agent_name", agent_name).execute()


async def set_agent_error(project_id: str, agent_name: str, error_msg: str) -> None:
    if _is_demo():
        for a in _demo_agents.get(project_id, []):
            if a["agent_name"] == agent_name:
                a["output"] = error_msg
                a["status"] = "error"
                a["completed_at"] = datetime.now(timezone.utc).isoformat()
                break
        _save_demo_db()
        return

    sb = get_supabase()
    sb.table("agent_outputs").update({
        "output": error_msg,
        "status": "error",
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("project_id", project_id).eq("agent_name", agent_name).execute()


async def delete_project(project_id: str, user_id: str) -> bool:
    if _is_demo():
        p = _demo_projects.pop(project_id, None)
        _demo_agents.pop(project_id, None)
        _save_demo_db()
        return p is not None

    sb = get_supabase()
    result = sb.table("projects").delete().eq("id", project_id).eq("user_id", user_id).execute()
    logger.info("project_deleted", project_id=project_id, user_id=user_id)
    return len(result.data) > 0


async def count_user_active_generations(user_id: str) -> int:
    if _is_demo():
        return sum(
            1 for p in _demo_projects.values()
            if p["user_id"] == user_id and p["status"] == "processing"
        )

    sb = get_supabase()
    result = (
        sb.table("projects")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("status", "processing")
        .execute()
    )
    return result.count or 0
