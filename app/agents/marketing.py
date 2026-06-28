import time
import structlog
from app.models.schemas import AgentName
from app.services.llm import stream_completion
from app.services.streaming import push_chunk
from app.services.supabase import create_agent_output, update_agent_output, set_agent_error

logger = structlog.get_logger()

MARKETING_SYSTEM_PROMPT = """You are a growth hacker and copywriter who has launched multiple viral products. You combine sharp copywriting with data-driven growth strategies.

Given the startup idea, founder analysis, and PM's MVP plan, produce a structured marketing strategy in markdown with these exact sections:

## Product tagline (3 options, ranked)
Write 3 taglines ranked from best to worst. Each should be memorable, concise, and communicate the core value.

## Hero headline + subheadline for landing page
Write a compelling hero section for the landing page:
- Headline: 6-10 words, punchy
- Subheadline: 1-2 sentences, explains the value proposition

## Target audience persona (detailed)
Create ONE detailed persona including:
- Name and demographic
- Job/role
- Pain points (3 specific ones)
- Goals (2-3)
- Where they spend time online
- What would make them try this product

## Top 3 acquisition channels (with why)
List the 3 best channels for this specific product with:
- Channel name
- Why it's the right fit
- One specific tactic for each

## Launch strategy (Product Hunt, Reddit, etc.)
Write a concrete launch plan with:
- Pre-launch (1 week before)
- Launch day
- Post-launch (1 week after)
- Specific subreddits, communities, or platforms to target

## 3 social media post drafts (Twitter/X)
Write 3 ready-to-post tweets that are engaging, specific, and optimized for virality. Include relevant hooks and calls to action.

Target ~350 words total. Be specific, not generic."""


async def run_marketing_agent(
    project_id: str,
    idea: str,
    domain: str,
    target_users: str,
    founder_output: str,
    pm_output: str,
) -> str:
    agent_name = AgentName.MARKETING

    await create_agent_output(project_id, agent_name.value)
    start = time.time()

    user_msg = f"""Startup Idea: {idea}
Domain: {domain}
Target Users: {target_users}

--- FOUNDER ANALYSIS ---
{founder_output}

--- PM MVP PLAN ---
{pm_output}

Produce the marketing strategy for this product."""

    full_output = ""
    try:
        async for text in stream_completion(MARKETING_SYSTEM_PROMPT, user_msg, preferred_provider="groq"):
            full_output += text
            await push_chunk(project_id, agent_name, text, done=False)

        elapsed = time.time() - start
        logger.info("marketing_done", project_id=project_id, elapsed=f"{elapsed:.1f}s", tokens=len(full_output))
        await update_agent_output(project_id, agent_name.value, full_output, "done")
        await push_chunk(project_id, agent_name, "", done=True)

    except Exception as e:
        logger.error("marketing_error", project_id=project_id, error=str(e))
        await set_agent_error(project_id, agent_name.value, str(e))
        await push_chunk(project_id, agent_name, "", done=True)
        raise

    return full_output
