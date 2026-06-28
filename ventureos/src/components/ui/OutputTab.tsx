import ReactMarkdown from "react-markdown";
import { TabType, Project } from "../../types";
import TypeWriter from "../motion/TypeWriter";
import D3MarketChart from "./D3MarketChart";
import D3RadarChart from "./D3RadarChart";
import InteractiveUXPreview from "./InteractiveUXPreview";
import AIBrandingSuite from "./AIBrandingSuite";
import AIPitchSimulator from "./AIPitchSimulator";
import MarketStudy from "./MarketStudy";
import { Terminal, Copy, Check, FileCode, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";

interface OutputTabProps {
  activeTab: TabType;
  project: Project;
  isStreaming?: boolean;
}

export default function OutputTab({
  activeTab,
  project,
  isStreaming = false,
}: OutputTabProps) {
  const [copied, setCopied] = useState(false);
  const [overviewSubView, setOverviewSubView] = useState<"doc" | "branding">("doc");
  const [wireframeSubView, setWireframeSubView] = useState<"doc" | "interactive">("doc");
  const [pitchSubView, setPitchSubView] = useState<"doc" | "simulator">("doc");

  // Parse helper for splitting Pitch Deck and Landing Page from the Pitch Coach agent
  const getTabContent = (): string => {
    switch (activeTab) {
      case "Overview":
        return project.agents.find((a) => a.name === "Venture Planner")?.output || "";
      case "Market":
        return project.agents.find((a) => a.name === "Market Analyst")?.output || "";
      case "Roadmap":
        return project.agents.find((a) => a.name === "Product Architect")?.output || "";
      case "Wireframe":
        return project.agents.find((a) => a.name === "UX Designer")?.output || "";
      case "Pitch Deck": {
        const coachOutput = project.agents.find((a) => a.name === "Pitch Coach")?.output || "";
        const parts = coachOutput.split(/## 2\.\s+Premium Landing Page Copy|###? Landing Page Copy/i);
        return parts[0] || "";
      }
      case "Landing Page": {
        const coachOutput = project.agents.find((a) => a.name === "Pitch Coach")?.output || "";
        const parts = coachOutput.split(/## 2\.\s+Premium Landing Page Copy|###? Landing Page Copy/i);
        return parts[1] ? `## Landing Page Copy\n${parts[1]}` : "";
      }
      default:
        return "";
    }
  };

  const rawContent = getTabContent().trim();

  // Find if the agent responsible for this tab is currently generating
  const getAgentStatus = () => {
    let agentName = "";
    if (activeTab === "Overview") agentName = "Venture Planner";
    else if (activeTab === "Market" || activeTab === "Market Study") agentName = "Market Analyst";
    else if (activeTab === "Roadmap") agentName = "Product Architect";
    else if (activeTab === "Wireframe") agentName = "UX Designer";
    else if (activeTab === "Pitch Deck" || activeTab === "Landing Page") agentName = "Pitch Coach";

    const agent = project.agents.find((a) => a.name === agentName);
    return agent ? agent.status : "waiting";
  };

  const currentStatus = getAgentStatus();

  const handleCopy = () => {
    if (!rawContent) return;
    navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/20 border border-white/5 rounded-xl overflow-hidden backdrop-blur-md">
      {/* Tab Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/60 border-b border-white/5">
        <div className="flex items-center gap-2 text-zinc-400">
          <Terminal className="w-4 h-4 text-[#7C6EF8]" />
          <span className="text-xs font-mono lowercase tracking-tight">
            ~/workspace/{activeTab.toLowerCase().replace(" ", "-")}.md
          </span>
          {currentStatus === "active" && (
            <span className="flex items-center gap-1.5 text-[9px] text-[#7C6EF8] font-mono font-medium animate-pulse ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C6EF8]" />
              streaming
            </span>
          )}
          {currentStatus === "completed" && (
            <span className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono font-medium ml-2">
              <CheckCircle2 className="w-3 h-3 text-zinc-500" />
              compiled
            </span>
          )}
        </div>

        {rawContent && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.25 text-xs text-zinc-400 hover:text-[#7C6EF8] bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 rounded-md transition-all duration-200"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Raw</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Sub-tab view toggle controls */}
      {activeTab === "Overview" && currentStatus === "completed" && (
        <div className="flex bg-zinc-950/80 p-1 border-b border-white/5 px-4 py-2 gap-2 shrink-0">
          <button
            onClick={() => setOverviewSubView("doc")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              overviewSubView === "doc"
                ? "bg-zinc-900 border border-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Venture Overview
          </button>
          <button
            onClick={() => setOverviewSubView("branding")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              overviewSubView === "branding"
                ? "bg-zinc-900 border border-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7C6EF8]" />
            AI Brand Suite
          </button>
        </div>
      )}

      {activeTab === "Wireframe" && currentStatus === "completed" && (
        <div className="flex bg-zinc-950/80 p-1 border-b border-white/5 px-4 py-2 gap-2 shrink-0">
          <button
            onClick={() => setWireframeSubView("doc")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              wireframeSubView === "doc"
                ? "bg-zinc-900 border border-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Switzerland-Grid Spec
          </button>
          <button
            onClick={() => setWireframeSubView("interactive")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              wireframeSubView === "interactive"
                ? "bg-zinc-900 border border-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7C6EF8]" />
            Interactive Prototype
          </button>
        </div>
      )}

      {activeTab === "Pitch Deck" && currentStatus === "completed" && (
        <div className="flex bg-zinc-950/80 p-1 border-b border-white/5 px-4 py-2 gap-2 shrink-0">
          <button
            onClick={() => setPitchSubView("doc")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              pitchSubView === "doc"
                ? "bg-zinc-900 border border-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Slide Outline
          </button>
          <button
            onClick={() => setPitchSubView("simulator")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              pitchSubView === "simulator"
                ? "bg-zinc-900 border border-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7C6EF8]" />
            AI VC Evaluator
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto select-text bg-[#0D0D0D] min-h-0">
        {activeTab === "Market" && project && (
          <div className="mb-6">
            <D3MarketChart project={project} />
          </div>
        )}

        {activeTab === "Overview" && overviewSubView === "doc" && project && (
          <div className="mb-6">
            <D3RadarChart project={project} />
          </div>
        )}

        {activeTab === "Overview" && overviewSubView === "branding" ? (
          <AIBrandingSuite project={project} />
        ) : activeTab === "Market Study" ? (
          <MarketStudy project={project} />
        ) : activeTab === "Wireframe" && wireframeSubView === "interactive" ? (
          <InteractiveUXPreview project={project} />
        ) : activeTab === "Pitch Deck" && pitchSubView === "simulator" ? (
          <AIPitchSimulator project={project} />
        ) : rawContent ? (
          <div className="markdown-body">
            {currentStatus === "active" ? (
              <div className="bg-white/[0.02] p-6 rounded-xl border border-white/5 relative shadow-sm">
                <TypeWriter text={rawContent} isStreaming={true} />
              </div>
            ) : (
              <ReactMarkdown>{rawContent}</ReactMarkdown>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 border border-white/5 text-zinc-600 mb-3 animate-pulse">
              <FileCode className="w-5 h-5" />
            </div>
            <p className="text-sm text-zinc-500 font-display tracking-tight">
              {currentStatus === "waiting"
                ? `Waiting for appropriate agent to initialize compilation...`
                : `Initializing stream canvas...`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
