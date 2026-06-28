export interface ProjectAgent {
  name: string;
  status: "waiting" | "active" | "completed" | "running";
  output: string;
}

export interface Project {
  id: string;
  idea: string;
  status: "incubating" | "completed" | "failed";
  agents: ProjectAgent[];
}

export type TabType = "Overview" | "Roadmap" | "Market" | "Wireframe" | "Pitch Deck" | "Market Study";

export interface ProjectHistoryItem {
  id: string;
  idea: string;
  timestamp: string;
}
