import time
import structlog
from app.models.schemas import AgentName
from app.services.llm import stream_completion
from app.services.streaming import push_chunk
from app.services.supabase import create_agent_output, update_agent_output, set_agent_error

logger = structlog.get_logger()

PM_SYSTEM_PROMPT = """You are a senior product manager who has shipped multiple successful MVPs at top startups. Your job is to define a lean, actionable MVP plan SPECIFIC to the startup idea and founder analysis provided.

CRITICAL: Your output must be entirely derived from the specific startup idea. Every feature, sprint task, and metric must relate directly to the product domain described. Do not produce generic PM templates.

Given the startup idea and the founder's analysis, produce a structured MVP definition in markdown with EXACTLY these sections:

## Core User Journey (3 Steps)
Describe the 3 essential steps a new user takes, specific to this product. Name the exact screens or actions involved (e.g., "User pastes invoice link → AI extracts line items → One-click export to CSV").

## MVP Feature List (must-have only, max 6)
List ONLY the features absolutely necessary for launch for THIS specific product. For each feature write one sentence describing it. Name actual UI elements, data types, or APIs relevant to this domain.

## Suggested Tech Stack for a Solo Builder
Recommend a specific, practical tech stack optimized for this exact use case. Include:
- Frontend framework (with reasoning for this specific product)
- Backend framework
- Database (explain why this data model fits the product)
- Hosting
- Key third-party libraries/APIs specific to this domain

## 4-Week Sprint Roadmap
Break down the build into 4 weekly sprints with concrete deliverables tied to this product:
- Week 1: [specific deliverables — name actual components/features]
- Week 2: [specific deliverables]
- Week 3: [specific deliverables]
- Week 4: [specific deliverables — include a basic launch step]

## Success Metrics (What Does "Working" Look Like?)
Define 3-5 measurable metrics specific to this product type with realistic target numbers (e.g., "50 active daily users within 30 days", "< 3-second task completion time").

Be opinionated and practical. Every item must be tied to the specific startup idea. Target 400-500 words total."""


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

    user_msg = f"""STARTUP IDEA: "{idea}"
Domain: {domain}
Target Users: {target_users}

--- FOUNDER ANALYSIS ---
{founder_output}

Produce a SPECIFIC MVP plan for THIS exact startup idea. Reference the idea and founder analysis directly. Every feature, sprint task, and metric must relate to this specific product domain."""

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
