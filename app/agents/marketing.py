import time
import structlog
from app.models.schemas import AgentName
from app.services.llm import stream_completion
from app.services.streaming import push_chunk
from app.services.supabase import create_agent_output, update_agent_output, set_agent_error

logger = structlog.get_logger()

MARKETING_SYSTEM_PROMPT = """You are a growth hacker and viral marketer who has launched multiple products from zero to traction. You combine sharp copywriting with channel-specific strategy grounded in data.

CRITICAL: Your entire output must be grounded in the SPECIFIC startup idea provided. Name real competitors, real platforms, real communities, and real tactics relevant to this exact domain. Do not produce generic marketing advice.

Given the startup idea, founder analysis, and PM's MVP plan, produce a structured marketing strategy in markdown with EXACTLY these sections:

## Product Tagline (3 Options, Ranked)
Write 3 taglines ranked best to worst. Each must reference the actual value proposition of THIS specific product. Be punchy and memorable.

## Hero Headline + Subheadline
Write a hero section for a landing page specific to this product:
- Headline: 6-10 words, punchy and specific (no generic "AI-powered" fluff)
- Subheadline: 1-2 sentences explaining the exact value delivered

## Target Audience Persona
Create ONE detailed, realistic persona for THIS product's primary user:
- Name + demographic
- Specific job title and daily workflow
- 3 specific pain points that THIS product solves
- 2-3 goals aligned with this product's value
- Specific platforms they use (e.g., Slack, Notion, Reddit r/freelance)
- What would make them sign up today

## Top 3 Acquisition Channels (With Reasoning)
Name the 3 best channels for THIS specific product with:
- Channel name and why it fits this specific domain
- One concrete, actionable tactic (e.g., "Post in r/SideProject with a demo GIF showing the 30-second workflow")

## Launch Strategy
Concrete launch plan for this specific product:
- Pre-launch (1 week before): Named specific communities, waitlist tactics
- Launch day: Named platforms (Product Hunt, Hacker News, specific subreddits)
- Post-launch (1 week after): Retention and word-of-mouth tactics

## 3 Social Media Post Drafts (Twitter/X)
Write 3 ready-to-post tweets specific to this product. Include hooks, problem framing, and CTAs. Make them feel authentic, not corporate.

Target ~400 words total. Be specific to THIS product, not generic startup marketing."""


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

    user_msg = f"""STARTUP IDEA: "{idea}"
Domain: {domain}
Target Users: {target_users}

--- FOUNDER ANALYSIS ---
{founder_output}

--- PM MVP PLAN ---
{pm_output}

Produce a SPECIFIC marketing strategy for THIS exact product. Every channel, tactic, tagline, and persona must directly relate to this specific startup idea and its target users."""

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
