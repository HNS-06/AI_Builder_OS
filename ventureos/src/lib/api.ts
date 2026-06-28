import { getCurrentToken } from "./supabase";

export const BACKEND_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getCurrentToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BACKEND_URL}${path}`, { headers });
  if (!res.ok) {
    throw new Error(`API GET ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function apiPost<T = any>(
  path: string,
  body: any
): Promise<T> {
  const headers = await getAuthHeader();
  headers["Content-Type"] = "application/json";
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API POST ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    throw new Error(
      `API DELETE ${path} failed: ${res.status} ${res.statusText}`
    );
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Mapping functions — backend ↔ frontend
// ---------------------------------------------------------------------------

const AGENT_NAME_MAP: Record<string, string> = {
  founder: "Venture Planner",
  pm: "Product Architect",
  uiux: "UX Designer",
  marketing: "Growth Strategist",
  market_analyst: "Market Analyst",
  investor: "Pitch Coach",
};

const PROJECT_STATUS_MAP: Record<string, "incubating" | "completed" | "failed"> = {
  processing: "incubating",
  done: "completed",
  error: "failed",
};

const AGENT_STATUS_MAP: Record<string, "waiting" | "active" | "completed"> = {
  waiting: "waiting",
  running: "active",
  done: "completed",
  error: "waiting",
};

export interface BackendAgent {
  name: string;
  status: string;
  output: string;
  completed_at: string | null;
}

export interface BackendProject {
  id: string | number;
  idea: string;
  status: string;
  created_at: string;
  agents?: BackendAgent[];
}

export interface FrontendAgent {
  name: string;
  status: "waiting" | "active" | "completed";
  output: string;
}

export interface FrontendProject {
  id: string;
  idea: string;
  status: "incubating" | "completed" | "failed";
  agents: FrontendAgent[];
}

export function mapBackendProject(bp: BackendProject): FrontendProject {
  return {
    id: String(bp.id),
    idea: bp.idea,
    status: PROJECT_STATUS_MAP[bp.status] ?? "incubating",
    agents: (bp.agents ?? []).map((a) => ({
      name: AGENT_NAME_MAP[a.name] ?? a.name,
      status: AGENT_STATUS_MAP[a.status] ?? "waiting",
      output: a.output ?? "",
    })),
  };
}

export interface BackendProjectListItem {
  id: string | number;
  idea: string;
  created_at: string;
  status: string;
}

export interface ProjectHistoryItem {
  id: string;
  idea: string;
  timestamp: string;
}

export function mapBackendHistoryItem(
  item: BackendProjectListItem
): ProjectHistoryItem {
  const date = new Date(item.created_at);
  return {
    id: String(item.id),
    idea: item.idea,
    timestamp: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

// ---------------------------------------------------------------------------
// SSE helpers
// ---------------------------------------------------------------------------

export function getStreamUrl(projectId: string): string {
  // EventSource cannot send custom headers — pass the token as a query param.
  // We intentionally build the URL synchronously; the token will be fetched
  // separately and appended before connecting.
  return `${BACKEND_URL}/api/stream/${projectId}`;
}

export async function getStreamUrlWithToken(projectId: string): Promise<string> {
  const token = await getCurrentToken();
  const base = `${BACKEND_URL}/api/stream/${projectId}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

// ---------------------------------------------------------------------------
// Demo mode helpers
// ---------------------------------------------------------------------------

export const isDemoMode = () =>
  import.meta.env.VITE_DEMO_MODE === "true";

export function getDemoBackendUrl(): string {
  return BACKEND_URL;
}
