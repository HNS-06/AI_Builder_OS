import asyncio
import structlog
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from app.agents.founder import run_founder_agent
from app.agents.pm import run_pm_agent
from app.agents.uiux import run_uiux_agent
from app.agents.marketing import run_marketing_agent
from app.agents.investor import run_investor_agent
from app.agents.market_analyst import run_market_analyst_agent
from app.services.supabase import update_project_status

logger = structlog.get_logger()


class PipelineState(TypedDict):
    project_id: str
    idea: str
    domain: str
    target_users: str
    founder_output: str
    pm_output: str
    uiux_output: str
    marketing_output: str
    market_analyst_output: str
    investor_output: str
    error: str


def parse_idea_node(state: PipelineState) -> dict:
    """Extract domain and target users from the idea (lightweight heuristics)."""
    idea = state["idea"].lower()
    domain = ""
    target_users = ""

    domain_keywords = {
        "health": "Healthcare", "fitness": "Health & Fitness", "medical": "Healthcare",
        "education": "Education", "learning": "Education", "school": "Education",
        "finance": "Fintech", "payment": "Fintech", "banking": "Fintech", "invoice": "Fintech",
        "ecommerce": "E-Commerce", "shop": "E-Commerce", "store": "E-Commerce",
        "social": "Social Media", "community": "Social Media",
        "productivity": "Productivity", "task": "Productivity", "todo": "Productivity",
        "ai": "AI/ML", "machine learning": "AI/ML", "automation": "AI/ML",
        "food": "Food & Beverage", "delivery": "Logistics", "travel": "Travel",
        "gaming": "Gaming", "entertainment": "Entertainment",
        "real estate": "Real Estate", "rent": "Real Estate",
        "saas": "SaaS", "b2b": "B2B SaaS", "crm": "B2B SaaS",
        "attendance": "Education", "smart": "IoT/Smart Systems",
        "hr": "HR Tech", "recruit": "HR Tech", "legal": "LegalTech",
        "security": "Cybersecurity", "crypto": "Web3/Crypto", "blockchain": "Web3/Crypto",
        "climate": "CleanTech", "energy": "CleanTech",
    }
    for kw, d in domain_keywords.items():
        if kw in idea:
            domain = d
            break
    if not domain:
        domain = "Technology"

    user_keywords = {
        "student": "Students", "teacher": "Teachers", "elderly": "Senior Citizens",
        "parent": "Parents", "business": "Business Owners", "developer": "Developers",
        "freelancer": "Freelancers", "remote": "Remote Workers", "small business": "SMBs",
        "enterprise": "Enterprise Teams", "consumer": "General Consumers",
        "founder": "Startup Founders", "investor": "Investors", "manager": "Managers",
        "doctor": "Healthcare Professionals", "patient": "Patients",
    }
    for kw, u in user_keywords.items():
        if kw in idea:
            target_users = u
            break
    if not target_users:
        target_users = "General consumers"

    logger.info("idea_parsed", project_id=state["project_id"], domain=domain, target_users=target_users)
    return {"domain": domain, "target_users": target_users}


async def founder_agent_node(state: PipelineState) -> dict:
    try:
        output = await run_founder_agent(
            project_id=state["project_id"],
            idea=state["idea"],
            domain=state["domain"],
            target_users=state["target_users"],
        )
        return {"founder_output": output}
    except Exception as e:
        return {"error": f"Founder agent failed: {e}"}


async def pm_agent_node(state: PipelineState) -> dict:
    try:
        output = await run_pm_agent(
            project_id=state["project_id"],
            idea=state["idea"],
            domain=state["domain"],
            target_users=state["target_users"],
            founder_output=state["founder_output"],
        )
        return {"pm_output": output}
    except Exception as e:
        return {"error": f"PM agent failed: {e}"}


async def uiux_agent_node(state: PipelineState) -> dict:
    try:
        output = await run_uiux_agent(
            project_id=state["project_id"],
            idea=state["idea"],
            domain=state["domain"],
            target_users=state["target_users"],
            pm_output=state["pm_output"],
        )
        return {"uiux_output": output}
    except Exception as e:
        return {"error": f"UI/UX agent failed: {e}"}


async def marketing_agent_node(state: PipelineState) -> dict:
    try:
        output = await run_marketing_agent(
            project_id=state["project_id"],
            idea=state["idea"],
            domain=state["domain"],
            target_users=state["target_users"],
            founder_output=state["founder_output"],
            pm_output=state["pm_output"],
        )
        return {"marketing_output": output}
    except Exception as e:
        return {"error": f"Marketing agent failed: {e}"}


async def market_analyst_agent_node(state: PipelineState) -> dict:
    try:
        output = await run_market_analyst_agent(
            project_id=state["project_id"],
            idea=state["idea"],
            domain=state["domain"],
            target_users=state["target_users"],
            founder_output=state["founder_output"],
        )
        return {"market_analyst_output": output}
    except Exception as e:
        return {"error": f"Market Analyst agent failed: {e}"}


async def investor_agent_node(state: PipelineState) -> dict:
    try:
        output = await run_investor_agent(
            project_id=state["project_id"],
            idea=state["idea"],
            domain=state["domain"],
            target_users=state["target_users"],
            founder_output=state["founder_output"],
            pm_output=state["pm_output"],
            uiux_output=state["uiux_output"],
            marketing_output=state["marketing_output"],
        )
        return {"investor_output": output}
    except Exception as e:
        return {"error": f"Investor agent failed: {e}"}


def should_continue_after_founder(state: PipelineState) -> str:
    if state.get("error"):
        return "error"
    return "continue"


def build_graph() -> StateGraph:
    graph = StateGraph(PipelineState)

    graph.add_node("parse_idea", parse_idea_node)
    graph.add_node("founder", founder_agent_node)
    graph.add_node("pm", pm_agent_node)
    graph.add_node("uiux", uiux_agent_node)
    graph.add_node("marketing", marketing_agent_node)
    graph.add_node("market_analyst", market_analyst_agent_node)
    graph.add_node("investor", investor_agent_node)

    graph.add_edge(START, "parse_idea")
    graph.add_edge("parse_idea", "founder")
    graph.add_conditional_edges(
        "founder",
        should_continue_after_founder,
        {
            "continue": "pm",
            "error": END,
        },
    )
    graph.add_edge("pm", "uiux")
    graph.add_edge("uiux", "marketing")
    graph.add_edge("marketing", "market_analyst")
    graph.add_edge("market_analyst", "investor")
    graph.add_edge("investor", END)

    return graph


compiled_graph = build_graph().compile()


async def run_pipeline(project_id: str, idea: str) -> None:
    """Execute the full agent pipeline for a project."""
    logger.info("pipeline_start", project_id=project_id)
    try:
        result = await compiled_graph.ainvoke({
            "project_id": project_id,
            "idea": idea,
            "domain": "",
            "target_users": "",
            "founder_output": "",
            "pm_output": "",
            "uiux_output": "",
            "marketing_output": "",
            "market_analyst_output": "",
            "investor_output": "",
            "error": "",
        })

        if result.get("error"):
            await update_project_status(project_id, "error")
            logger.error("pipeline_error", project_id=project_id, error=result["error"])
        else:
            await update_project_status(project_id, "done")
            logger.info("pipeline_complete", project_id=project_id)

    except Exception as e:
        await update_project_status(project_id, "error")
        logger.error("pipeline_exception", project_id=project_id, error=str(e))
