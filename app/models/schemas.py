from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime
from uuid import UUID


class ProjectStatus(str, Enum):
    PROCESSING = "processing"
    DONE = "done"
    ERROR = "error"


class AgentStatus(str, Enum):
    WAITING = "waiting"
    RUNNING = "running"
    DONE = "done"
    ERROR = "error"


class AgentName(str, Enum):
    FOUNDER = "founder"
    PM = "pm"
    UIUX = "uiux"
    MARKETING = "marketing"
    INVESTOR = "investor"


# --- Request Models ---

class GenerateRequest(BaseModel):
    idea: str = Field(..., min_length=10, max_length=2000, description="Startup idea description")


# --- Response Models ---

class AgentOutput(BaseModel):
    name: AgentName
    status: AgentStatus
    output: str = ""
    completed_at: datetime | None = None


class ProjectResponse(BaseModel):
    id: UUID
    idea: str
    status: ProjectStatus
    created_at: datetime
    agents: list[AgentOutput] = []


class ProjectListItem(BaseModel):
    id: UUID
    idea: str
    created_at: datetime
    status: ProjectStatus


class GenerateResponse(BaseModel):
    project_id: UUID
    status: ProjectStatus


# --- SSE Models ---

class SSEChunk(BaseModel):
    agent: AgentName
    chunk: str
    done: bool
