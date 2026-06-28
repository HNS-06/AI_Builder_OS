import time
import structlog
from app.models.schemas import AgentName
from app.services.llm import stream_completion
from app.services.streaming import push_chunk
from app.services.supabase import create_agent_output, update_agent_output, set_agent_error

logger = structlog.get_logger()

INVESTOR_SYSTEM_PROMPT = """You are a seasoned VC partner who has heard thousands of pitches and funded dozens of unicorns. You prepare founders to nail their pre-seed pitch.

Given the startup idea and ALL previous agent analyses, produce a pre-seed pitch summary in markdown with these exact sections:

## One-liner pitch
A single sentence that would make a VC lean in and say "tell me more."

## Problem / Solution / Why now (3 sentences each)
- Problem: 3 sentences that make the pain visceral
- Solution: 3 sentences that paint the vision
- Why now: 3 sentences that create urgency

## Business model
Clearly describe how this company makes money. Be specific about pricing and unit economics.

## Traction milestones to hit before raising
List 5-7 specific milestones the founder should hit before approaching investors. Include concrete numbers where possible.

## Ideal investor profile
Describe the TYPE of investors who would be the best fit for this startup. Include fund stage, thesis, and examples of relevant portfolio companies.

## 3 potential objections + how to handle them
For each objection:
- The objection (what a skeptical VC would say)
- The response (how the founder should counter it)

## Suggested ask for a hackathon demo day
Recommend a specific ask (amount + use of funds) that is realistic for a hackathon/demo day context.

Target ~400 words total. Be brutally honest and practical, not generic or fluffy."""


async def run_investor_agent(
    project_id: str,
    idea: str,
    domain: str,
    target_users: str,
    founder_output: str,
    pm_output: str,
    uiux_output: str,
    marketing_output: str,
) -> str:
    agent_name = AgentName.INVESTOR

    await create_agent_output(project_id, agent_name.value)
    start = time.time()

    user_msg = f"""Startup Idea: {idea}
Domain: {domain}
Target Users: {target_users}

--- FOUNDER ANALYSIS ---
{founder_output}

--- PM MVP PLAN ---
{pm_output}

--- UI/UX DESIGN BRIEF ---
{uiux_output}

--- MARKETING STRATEGY ---
{marketing_output}

Produce the investor pitch summary based on all analyses above."""

    full_output = ""
    try:
        async for text in stream_completion(INVESTOR_SYSTEM_PROMPT, user_msg, preferred_provider="groq"):
            full_output += text
            await push_chunk(project_id, agent_name, text, done=False)

        elapsed = time.time() - start
        logger.info("investor_done", project_id=project_id, elapsed=f"{elapsed:.1f}s", tokens=len(full_output))
        await update_agent_output(project_id, agent_name.value, full_output, "done")
        await push_chunk(project_id, agent_name, "", done=True)

    except Exception as e:
        logger.error("investor_error", project_id=project_id, error=str(e))
        await set_agent_error(project_id, agent_name.value, str(e))
        await push_chunk(project_id, agent_name, "", done=True)
        raise

    return full_output
