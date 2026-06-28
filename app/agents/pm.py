import time
import structlog
from app.models.schemas import AgentName
from app.services.llm import stream_completion
from app.services.streaming import push_chunk
from app.services.supabase import create_agent_output, update_agent_output, set_agent_error

logger = structlog.get_logger()

PM_SYSTEM_PROMPT = """You are a senior product manager who has shipped multiple successful MVPs at top startups. Your job is to define a lean, actionable MVP plan based on the founder's analysis.

Given the startup idea and the founder's analysis, produce a structured MVP definition in markdown with these exact sections:

## Core user journey (3 steps)
Describe the 3 essential steps a new user takes from first touch to value delivery. Be concrete.

## MVP feature list (must-have only, max 6)
List ONLY the features that are absolutely necessary for launch. For each feature, write one sentence describing it.

## Suggested tech stack for a solo builder
Recommend a specific, practical tech stack for a solo developer or small team. Include:
- Frontend framework
- Backend framework
- Database
- Hosting
- Key libraries/APIs

## 4-week sprint roadmap (week-by-week)
Break down the build into 4 weekly sprints:
- Week 1: [specific deliverables]
- Week 2: [specific deliverables]
- Week 3: [specific deliverables]
- Week 4: [specific deliverables]

## Success metrics (what does "working" look like?)
Define 3-5 measurable metrics that indicate the MVP is working. Include target numbers where possible.

Be opinionated and practical. Target 350-450 words total. Prioritize speed-to-market over perfection."""


async def run_pm_agent(
    project_id: str,
    idea: str,
    domain: str,
    target_users: str,
    founder_output: str,
) -> str:
    agent_name = AgentName.PM

    await create_agent_output(project_id, agent_name.value)
    start = time.time()

    user_msg = f"""Startup Idea: {idea}
Domain: {domain}
Target Users: {target_users}

--- FOUNDER ANALYSIS ---
{founder_output}

Produce the MVP definition based on this analysis."""

    full_output = ""
    try:
        async for text in stream_completion(PM_SYSTEM_PROMPT, user_msg, preferred_provider="groq"):
            full_output += text
            await push_chunk(project_id, agent_name, text, done=False)

        elapsed = time.time() - start
        logger.info("pm_done", project_id=project_id, elapsed=f"{elapsed:.1f}s", tokens=len(full_output))
        await update_agent_output(project_id, agent_name.value, full_output, "done")
        await push_chunk(project_id, agent_name, "", done=True)

    except Exception as e:
        logger.error("pm_error", project_id=project_id, error=str(e))
        await set_agent_error(project_id, agent_name.value, str(e))
        await push_chunk(project_id, agent_name, "", done=True)
        raise

    return full_output
