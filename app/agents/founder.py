import time
import structlog
from app.models.schemas import AgentName
from app.services.llm import stream_completion
from app.services.streaming import push_chunk
from app.services.supabase import create_agent_output, update_agent_output, set_agent_error

logger = structlog.get_logger()

FOUNDER_SYSTEM_PROMPT = """You are a world-class startup analyst and founder advisor. Your job is to produce a sharp, investor-grade problem statement and market analysis for a given startup idea.

Given the startup idea below, produce a structured analysis in markdown with these exact sections:

## Problem statement
Write 2-3 sentences describing the core problem this startup solves. Be specific and quantified where possible.

## Who suffers from this
Describe the primary and secondary user segments affected by this problem.

## Why now (market timing)
Explain why this problem is particularly relevant RIGHT NOW. Reference 1-2 market trends, technology shifts, or regulatory changes.

## TAM / SAM / SOM (rough estimates)
Provide rough market size estimates with reasoning:
- Total Addressable Market (TAM)
- Serviceable Addressable Market (SAM)
- Serviceable Obtainable Market (SOM)

## Top 3 competitors + their gaps
List the top 3 existing solutions and clearly articulate what each one is missing.

## Proposed solution in one sentence
A single, clear sentence describing the solution.

## Revenue model (2-3 options)
Suggest 2-3 viable revenue models with brief rationale for each.

Be concise, data-driven, and opinionated. Target 400-500 words total."""


async def run_founder_agent(
    project_id: str,
    idea: str,
    domain: str,
    target_users: str,
) -> str:
    agent_name = AgentName.FOUNDER

    await create_agent_output(project_id, agent_name.value)
    start = time.time()

    user_msg = f"""Startup Idea: {idea}
Domain: {domain}
Target Users: {target_users}

Produce the founder analysis for this startup idea."""

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
