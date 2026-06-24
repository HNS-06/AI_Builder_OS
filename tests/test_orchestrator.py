import asyncio
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.agents.orchestrator import run_pipeline, parse_idea_node


def test_parse_idea_node():
    state = {
        "project_id": "test-123",
        "idea": "A smart attendance app for schools that uses facial recognition",
        "domain": "",
        "target_users": "",
        "founder_output": "",
        "pm_output": "",
        "uiux_output": "",
        "marketing_output": "",
        "investor_output": "",
        "error": "",
    }
    result = parse_idea_node(state)
    assert result["domain"] == "Education"
    assert result["target_users"] == "Students"


def test_parse_idea_finance():
    state = {
        "project_id": "test-123",
        "idea": "A payment app for freelancers to invoice clients",
        "domain": "",
        "target_users": "",
        "founder_output": "",
        "pm_output": "",
        "uiux_output": "",
        "marketing_output": "",
        "investor_output": "",
        "error": "",
    }
    result = parse_idea_node(state)
    assert result["domain"] == "Fintech"
    assert result["target_users"] == "Freelancers"


def test_parse_idea_default():
    state = {
        "project_id": "test-123",
        "idea": "A cool new product for everyone",
        "domain": "",
        "target_users": "",
        "founder_output": "",
        "pm_output": "",
        "uiux_output": "",
        "marketing_output": "",
        "investor_output": "",
        "error": "",
    }
    result = parse_idea_node(state)
    assert result["domain"] == "Technology"
    assert result["target_users"] == "General consumers"


def test_parse_idea_healthcare():
    state = {
        "project_id": "test-123",
        "idea": "An elderly care monitoring system with fall detection",
        "domain": "",
        "target_users": "",
        "founder_output": "",
        "pm_output": "",
        "uiux_output": "",
        "marketing_output": "",
        "investor_output": "",
        "error": "",
    }
    result = parse_idea_node(state)
    assert result["domain"] == "Healthcare"
    assert result["target_users"] == "Senior Citizens"
