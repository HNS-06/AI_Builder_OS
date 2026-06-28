import time
import structlog
from app.models.schemas import AgentName
from app.services.llm import stream_completion
from app.services.streaming import push_chunk
from app.services.supabase import create_agent_output, update_agent_output, set_agent_error

logger = structlog.get_logger()

FOUNDER_SYSTEM_PROMPT = """You are a world-class startup analyst and founder advisor with deep expertise across B2B SaaS, consumer apps, marketplaces, and deep tech. Your job is to produce a sharp, investor-grade problem statement and market analysis SPECIFIC to the exact startup idea provided.

CRITICAL: Every section must be directly derived from the startup idea given. Do NOT produce generic analysis. Reference the specific problem domain, named user types, and real market dynamics relevant to this idea.

Given the startup idea below, produce a structured analysis in markdown with EXACTLY these sections:

## Problem Statement
Write 2-3 sentences describing the SPECIFIC core problem this startup solves. Include quantified pain (time lost, money wasted, error rate, etc.) that is directly relevant to this domain.

## Who Suffers From This
Name the PRIMARY user segment and SECONDARY user segment with specific job titles and realistic daily struggles tied to this exact problem.

## Why Now (Market Timing)
Explain why THIS specific problem is particularly relevant RIGHT NOW in 2024-2025. Reference 1-2 real, named market trends, technology shifts (LLMs, APIs, regulations) specific to this domain.

## TAM / SAM / SOM
Provide market size estimates with specific reasoning tied to this domain:
- TAM (Total Addressable Market): Global opportunity — provide a dollar figure (e.g. $X Billion)
- SAM (Serviceable Addressable Market): Realistically reachable segment — provide a dollar figure (e.g. $X Billion or $X Million)  
- SOM (Serviceable Obtainable Market): Year 1-3 capture — provide a dollar figure (e.g. $X Million)
Format each line as: "- **TAM**: $XX Billion — [one sentence reasoning]"

## Top 3 Competitors + Their Gaps
Name 3 REAL, existing companies or products in this specific space. For each:
- Company name + one-line description of what they do
- Their critical weakness or gap that this startup would exploit

## Proposed Solution in One Sentence
A single, crisp sentence describing the solution to THIS specific idea.

## Revenue Model (2-3 Options)
Suggest 2-3 viable revenue models with pricing specifics and rationale tied to this market.

Be concise, data-driven, and opinionated. Every sentence must be tied to the specific startup idea. Target 450-550 words total."""


async def run_founder_agent(
    project_id: str,
    idea: str,
    domain: str,
    target_users: str,
) -> str:
    agent_name = AgentName.FOUNDER

    await create_agent_output(project_id, agent_name.value)
    start = time.time()

    user_msg = f"""STARTUP IDEA TO ANALYZE: "{idea}"
Domain: {domain}
Target Users: {target_users}

Produce a SPECIFIC, DATA-DRIVEN founder analysis for THIS exact startup idea. Every section must directly reference details from the idea above. Do not give generic startup advice."""

    full_output = ""
    try:
        async for text in stream_completion(FOUNDER_SYSTEM_PROMPT, user_msg, preferred_provider="groq"):
            full_output += text
            await push_chunk(project_id, agent_name, text, done=False)

        elapsed = time.time() - start
        logger.info("founder_done", project_id=project_id, elapsed=f"{elapsed:.1f}s", tokens=len(full_output))
        await update_agent_output(project_id, agent_name.value, full_output, "done")
        await push_chunk(project_id, agent_name, "", done=True)

    except Exception as e:
        logger.error("founder_error", project_id=project_id, error=str(e))
        await set_agent_error(project_id, agent_name.value, str(e))
        await push_chunk(project_id, agent_name, "", done=True)
        raise

    return full_output
