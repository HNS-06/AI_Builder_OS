import time
import structlog
from app.models.schemas import AgentName
from app.services.llm import stream_completion
from app.services.local_ai import generate_uiux as local_generate_uiux
from app.services.streaming import push_chunk, push_status
from app.services.supabase import create_agent_output, update_agent_output, set_agent_error

logger = structlog.get_logger()

UIUX_SYSTEM_PROMPT = """You are a senior product designer who has designed consumer apps at YC-level startups. You think in user flows, not just screens. Your designs prioritize clarity, delight, and conversion.

Given the startup idea and the PM's MVP plan, produce a structured UI/UX design brief in markdown with these exact sections:

## Key screens to design (list 4-5 screens with description)
For each screen, write:
- Screen name
- 1-2 sentence description of what the user sees and does

## User flow (written step-by-step, not a diagram)
Describe the complete user journey from landing to core value delivery as numbered steps. Be specific about what happens at each step.

## Design principles for this product
List 3-4 design principles that should guide every design decision for this product. Make them specific to this domain, not generic.

## Color palette suggestion (name 3 hex values + rationale)
Suggest exactly 3 hex color values with:
- Color name
- Hex code
- Where it's used
- Why this color for this product

## Typography suggestion
Recommend a specific font pairing (heading + body) with rationale.

## One unique UI idea that would make this product memorable
Describe one creative, memorable UI element or interaction that would differentiate this product from competitors. Be specific and imaginative.

Target 300-400 words total. Be specific and actionable, not vague."""


async def run_uiux_agent(
    project_id: str,
    idea: str,
    domain: str,
    target_users: str,
    pm_output: str,
) -> str:
    agent_name = AgentName.UIUX

    await create_agent_output(project_id, agent_name.value)
    await push_status(project_id, agent_name, "running")
    start = time.time()

    user_msg = f"""Startup Idea: {idea}
Domain: {domain}
Target Users: {target_users}

--- PM MVP PLAN ---
{pm_output}

Produce the UI/UX design brief for this product."""

    full_output = ""
    try:
        try:
            async for text in stream_completion(UIUX_SYSTEM_PROMPT, user_msg, preferred_provider="groq"):
                full_output += text
                await push_chunk(project_id, agent_name, text, done=False)
        except RuntimeError:
            logger.info("uiux_fallback_local", project_id=project_id)
            async for text in local_generate_uiux(idea, pm_output):
                full_output += text
                await push_chunk(project_id, agent_name, text, done=False)

        elapsed = time.time() - start
        logger.info("uiux_done", project_id=project_id, elapsed=f"{elapsed:.1f}s", tokens=len(full_output))
        await update_agent_output(project_id, agent_name.value, full_output, "done")
        await push_status(project_id, agent_name, "done")
        await push_chunk(project_id, agent_name, "", done=True)

    except Exception as e:
        logger.error("uiux_error", project_id=project_id, error=str(e))
        await set_agent_error(project_id, agent_name.value, str(e))
        await push_status(project_id, agent_name, "error")
        await push_chunk(project_id, agent_name, "", done=True)
        raise

    return full_output
