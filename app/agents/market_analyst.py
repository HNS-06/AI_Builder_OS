import time
import structlog
from app.models.schemas import AgentName
from app.services.llm import stream_completion
from app.services.streaming import push_chunk
from app.services.supabase import create_agent_output, update_agent_output, set_agent_error

logger = structlog.get_logger()

MARKET_ANALYST_SYSTEM_PROMPT = """You are a world-class market research analyst with deep expertise in competitive intelligence, consumer insights, and market sizing across all verticals. Your job is to produce a rigorous, data-driven market analysis SPECIFIC to the startup idea provided.

CRITICAL: Every number, competitor name, demographic, and insight must be directly relevant to THIS startup idea. Do not produce generic market analysis. Reference the actual domain, named competitors, and real market dynamics.

Produce a structured market analysis in markdown with EXACTLY these sections:

## Market Overview
2-3 sentences describing the current state and trajectory of THIS specific market. Include the market size and growth rate.

## TAM / SAM / SOM Analysis
Provide specific dollar estimates with clear methodology:
- **TAM**: $XX Billion — [explain the global market calculation]
- **SAM**: $XX Billion — [explain the serviceable segment]
- **SOM**: $XX Million — [explain realistic 3-year capture]

## Problem Validation Score
Rate this problem on these exact dimensions (provide a score from 1-100 for each):
- **Pain Intensity**: XX/100 — [one sentence justification]
- **Usage Frequency**: XX/100 — [one sentence justification]
- **Budget Availability**: XX/100 — [one sentence justification]
- **Willingness to Pay**: XX/100 — [one sentence justification]
- **Overall Validation Score**: XX/100

## Target Audience Profile
- **Primary Role**: [specific job title or user type]
- **Age Range**: [realistic range]
- **Income/Budget**: [realistic range]
- **Core Motivation**: [2-3 sentences on what drives them]
- **Adoption Habits**: [2-3 sentences on how they discover and adopt tools]

## Top 3 Competitors (Real Companies)
For each competitor, provide EXACTLY this format:
**[Company Name]** | Funding: $XXX | Users: XXX
Strength: [one sentence]
Weakness: [one sentence — the gap your startup exploits]

## Market Growth Trend
Describe the 12-month search/adoption interest trend for this market category. Rate each month from 0-100 (July to June) as a comma-separated list, showing growth trajectory:
TREND_DATA: [Jul, Aug, Sep, Oct, Nov, Dec, Jan, Feb, Mar, Apr, May, Jun]
Example: TREND_DATA: [45, 48, 52, 58, 62, 65, 70, 72, 78, 82, 88, 95]

## Key Market Signals
List 3 recent industry developments (real trends, regulatory changes, funding rounds, or technology shifts) relevant to this market that create urgency for this startup.

Be data-driven, specific, and analytical. Every insight must be tied to THIS startup idea. Target 500-600 words total."""


async def run_market_analyst_agent(
    project_id: str,
    idea: str,
    domain: str,
    target_users: str,
    founder_output: str,
) -> str:
    agent_name = AgentName.MARKET_ANALYST

    await create_agent_output(project_id, agent_name.value)
    start = time.time()

    user_msg = f"""STARTUP IDEA: "{idea}"
Domain: {domain}
Target Users: {target_users}

--- FOUNDER ANALYSIS (for context) ---
{founder_output}

Produce a SPECIFIC, DATA-DRIVEN market analysis for THIS exact startup idea. Name real competitors in this space, provide realistic market size estimates for this domain, and score the problem validation based on actual market dynamics. Every number and name must be directly relevant to this specific idea."""

    full_output = ""
    try:
        async for text in stream_completion(MARKET_ANALYST_SYSTEM_PROMPT, user_msg, preferred_provider="groq"):
            full_output += text
            await push_chunk(project_id, agent_name, text, done=False)

        elapsed = time.time() - start
        logger.info("market_analyst_done", project_id=project_id, elapsed=f"{elapsed:.1f}s", tokens=len(full_output))
        await update_agent_output(project_id, agent_name.value, full_output, "done")
        await push_chunk(project_id, agent_name, "", done=True)

    except Exception as e:
        logger.error("market_analyst_error", project_id=project_id, error=str(e))
        await set_agent_error(project_id, agent_name.value, str(e))
        await push_chunk(project_id, agent_name, "", done=True)
        raise

    return full_output
