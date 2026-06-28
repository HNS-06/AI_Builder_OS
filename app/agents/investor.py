import time
import structlog
from app.models.schemas import AgentName
from app.services.llm import stream_completion
from app.services.local_ai import generate_investor as local_generate_investor
from app.services.streaming import push_chunk, push_status
from app.services.supabase import create_agent_output, update_agent_output, set_agent_error

logger = structlog.get_logger()

INVESTOR_SYSTEM_PROMPT = """You are a seasoned pre-seed VC partner with 15+ years of investing across SaaS, consumer, fintech, and deep tech. You have heard thousands of pitches and funded dozens of breakout startups. Your job is to help a founder nail their pre-seed pitch for THIS specific startup idea.

CRITICAL: Your output must be entirely specific to the startup idea and all prior agent analyses provided. Reference real competitors, real market dynamics, real traction milestones relevant to this domain. Do not produce generic pitch templates.

Given the startup idea and ALL previous agent analyses, produce a pre-seed pitch summary in markdown with EXACTLY these sections:

## One-Liner Pitch
A single, highly specific sentence that would make a VC lean in. Include the market, mechanism, and differentiation.

## Problem / Solution / Why Now
- **Problem** (3 sentences): Make the pain visceral and quantified, specific to THIS domain
- **Solution** (3 sentences): Paint the concrete vision of how this product works
- **Why Now** (3 sentences): Create urgency using real, current market dynamics

## Business Model
Describe specifically how THIS company makes money. Include:
- Primary revenue model with realistic pricing tiers
- Unit economics estimate (LTV, CAC ratio target)
- Path to $1M ARR

## Traction Milestones Before Raising Seed
List 6-8 SPECIFIC milestones this founder must hit before approaching seed investors. Include concrete numbers relevant to this product's domain (users, MRR, retention rate, pilot contracts, etc.).

## Ideal Investor Profile
Name the TYPE of investors who are the best fit — include fund stage, thesis, and 3-5 specific examples of real VC firms or angels that invest in this exact domain.

## 3 Potential Investor Objections + Rebuttals
For each objection:
- **Objection**: A hard question a skeptical VC would ask about THIS specific idea
- **Rebuttal**: A concrete, data-backed response specific to this market

## Suggested Pre-Seed Ask
Recommend a specific funding ask with use-of-funds breakdown appropriate for this domain and stage.

Target ~450 words total. Be brutally honest, domain-specific, and practical."""


async def run_investor_agent(
    project_id: str,
    idea: str,
    domain: str,
    target_users: str,
    founder_output: str,
    marketing_output: str,
    market_analyst_output: str,
) -> str:
    agent_name = AgentName.INVESTOR

    await create_agent_output(project_id, agent_name.value)
    await push_status(project_id, agent_name, "running")
    start = time.time()

    user_msg = f"""STARTUP IDEA: "{idea}"
Domain: {domain}
Target Users: {target_users}

--- FOUNDER ANALYSIS ---
{founder_output}

--- MARKETING STRATEGY ---
{marketing_output}

--- MARKET ANALYST DATA ---
{market_analyst_output}

Produce a SPECIFIC investor pitch summary grounded in all analyses above. Reference this exact startup idea in every section. Avoid generic pitch advice — every sentence must be tied to this specific product, market, and competitive landscape."""

    full_output = ""
    try:
        try:
            async for text in stream_completion(INVESTOR_SYSTEM_PROMPT, user_msg, preferred_provider="groq"):
                full_output += text
                await push_chunk(project_id, agent_name, text, done=False)
        except RuntimeError:
            logger.info("investor_fallback_local", project_id=project_id)
            async for text in local_generate_investor(idea, founder_output, marketing_output, market_analyst_output):
                full_output += text
                await push_chunk(project_id, agent_name, text, done=False)

        elapsed = time.time() - start
        logger.info("investor_done", project_id=project_id, elapsed=f"{elapsed:.1f}s", tokens=len(full_output))
        await update_agent_output(project_id, agent_name.value, full_output, "done")
        await push_status(project_id, agent_name, "done")
        await push_chunk(project_id, agent_name, "", done=True)

    except Exception as e:
        logger.error("investor_error", project_id=project_id, error=str(e))
        await set_agent_error(project_id, agent_name.value, str(e))
        await push_status(project_id, agent_name, "error")
        await push_chunk(project_id, agent_name, "", done=True)
        raise

    return full_output
