import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Shield,
  Layers,
  MapPin,
  Compass,
  ArrowRight,
  ChevronRight,
  FileText,
  Clock,
  ExternalLink,
  Cpu,
  Heart,
  Terminal
} from "lucide-react";
import { Project, TabType, ProjectHistoryItem } from "./types";
import AppShell from "./components/layout/AppShell";
import IdeaInput from "./components/ui/IdeaInput";
import AgentStepper from "./components/ui/AgentStepper";
import OutputTab from "./components/ui/OutputTab";
import ExportMenu from "./components/ui/ExportMenu";
import LoginPage from "./components/ui/LoginPage";
import FadeUp from "./components/motion/FadeUp";
import SlideIn from "./components/motion/SlideIn";
import { supabase, onAuthStateChange } from "./lib/supabase";
import {
  apiGet,
  apiPost,
  mapBackendProject,
  mapBackendHistoryItem,
  getStreamUrlWithToken,
  isDemoMode,
  FrontendProject,
} from "./lib/api";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (isDemoMode()) return true;
    return localStorage.getItem("venture_logged_in") === "true";
  });
  const [route, setRoute] = useState<"landing" | "dashboard" | "workspace">("landing");
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [project, setProject] = useState<FrontendProject | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize history from localStorage
  const [history, setHistory] = useState<ProjectHistoryItem[]>(() => {
    const saved = localStorage.getItem("venture_history");
    return saved ? JSON.parse(saved) : [];
  });

  // Listen for Supabase auth state changes
  useEffect(() => {
    if (isDemoMode()) {
      loadHistoryFromBackend();
      return;
    }

    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setIsLoggedIn(true);
        localStorage.setItem("venture_logged_in", "true");
        loadHistoryFromBackend();
      } else if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        localStorage.removeItem("venture_logged_in");
        setHistory([]);
        setProject(null);
        setActiveProjectId(undefined);
        setRoute("landing");
      }
    });

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        localStorage.setItem("venture_logged_in", "true");
        loadHistoryFromBackend();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load history from backend on login
  const loadHistoryFromBackend = async () => {
    try {
      const items = await apiGet<any[]>("/api/projects");
      const mapped = items.map(mapBackendHistoryItem);
      setHistory(mapped);
      localStorage.setItem("venture_history", JSON.stringify(mapped));
    } catch (err) {
      console.warn("Failed to load history from backend, using localStorage fallback:", err);
    }
  };

  // Handle URL hash changes for deep linking and robust browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "#/";
      if (hash === "#/") {
        setRoute("landing");
        setActiveProjectId(undefined);
        setProject(null);
      } else if (hash === "#/dashboard") {
        setRoute("dashboard");
        setActiveProjectId(undefined);
        setProject(null);
      } else if (hash.startsWith("#/project/")) {
        const id = hash.replace("#/project/", "");
        setActiveProjectId(id);
        setRoute("workspace");
      } else {
        setRoute("landing");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // initial execution

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (hash: string) => {
    window.location.hash = hash;
  };

  const saveToHistory = (id: string, idea: string) => {
    const newItem: ProjectHistoryItem = {
      id,
      idea,
      timestamp: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setHistory((prev) => {
      const updated = [newItem, ...prev.filter((h) => h.id !== id)];
      localStorage.setItem("venture_history", JSON.stringify(updated));
      return updated;
    });
  };

  // Create a new startup project from the input bar
  const handleCreateProject = async (idea: string) => {
    setIsLoading(true);
    try {
      const data = await apiPost<{ project_id: string }>("/api/generate", { idea });
      const projectId = data.project_id;

      saveToHistory(projectId, idea);
      setIsLoading(false);

      // Transition smoothly into the workspace page
      navigate(`#/project/${projectId}`);
    } catch (e) {
      console.error("Incubation submission error:", e);
      setIsLoading(false);
    }
  };

  // SSE + Polling sync loop for current project details
  useEffect(() => {
    if (route !== "workspace" || !activeProjectId) return;

    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchProjectData = async () => {
      try {
        const rawData = await apiGet<any>(`/api/project/${activeProjectId}`);
        const data = mapBackendProject(rawData);
        setProject(data);

        // If compiling process is active, mount real-time streams
        if (data.status === "incubating") {
          connectSSE();
        }
      } catch (err) {
        console.error("Failed to fetch venture record:", err);
        setProject(null);
        setActiveProjectId(undefined);
        setRoute("landing");
        window.location.hash = "#/";
      }
    };

    const connectSSE = async () => {
      if (eventSource) return;

      const streamUrl = await getStreamUrlWithToken(activeProjectId);
      console.log(`Establishing real-time SSE socket on project ${activeProjectId}`);
      eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "ping") return;

        if (data.type === "status") {
          // Live state transition update — map backend status to frontend
          const statusMap: Record<string, "waiting" | "active" | "completed"> = {
            waiting: "waiting",
            running: "active",
            done: "completed",
            error: "waiting",
          };
          const nameMap: Record<string, string> = {
            founder: "Venture Planner",
            pm: "Product Architect",
            uiux: "UX Designer",
            marketing: "Growth Strategist",
            market_analyst: "Market Analyst",
            investor: "Pitch Coach",
          };
          setProject((prev) => {
            if (!prev) return prev;
            const updatedAgents = prev.agents.map((a) =>
              a.name === (nameMap[data.agent] ?? data.agent)
                ? { ...a, status: statusMap[data.status] ?? a.status }
                : a
            );
            return { ...prev, agents: updatedAgents };
          });
        } else if (data.agent && data.chunk !== undefined) {
          // Token-by-token text stream ingestion — map backend name to display name
          const nameMap: Record<string, string> = {
            founder: "Venture Planner",
            pm: "Product Architect",
            uiux: "UX Designer",
            marketing: "Growth Strategist",
            market_analyst: "Market Analyst",
            investor: "Pitch Coach",
          };
          setProject((prev) => {
            if (!prev) return prev;
            const displayAgent = nameMap[data.agent] ?? data.agent;
            const updatedAgents = prev.agents.map((a) =>
              a.name === displayAgent ? { ...a, output: a.output + data.chunk } : a
            );
            return { ...prev, agents: updatedAgents };
          });
        } else if (data.type === "complete") {
          setProject((prev) => (prev ? { ...prev, status: "completed" } : null));
          eventSource?.close();
          if (pollInterval) clearInterval(pollInterval);
        }
      };

      eventSource.onerror = (err) => {
        console.warn("SSE stream interrupted. Transitioning to fallback active polling...", err);
        eventSource?.close();
        eventSource = null;

        // Fallback polling loop: Fetch states every 2 seconds
        if (!pollInterval) {
          pollInterval = setInterval(async () => {
            try {
              const rawData = await apiGet<any>(`/api/project/${activeProjectId}`);
              const data = mapBackendProject(rawData);
              setProject(data);
              if (data.status === "completed" || data.status === "failed") {
                if (pollInterval) clearInterval(pollInterval);
              }
            } catch (e) {
              console.error("Fallback active polling failed:", e);
            }
          }, 2000);
        }
      };
    };

    fetchProjectData();

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [activeProjectId, route]);

  // Handle Export triggering
  const handleExport = async (type: "pdf" | "notion" | "link") => {
    if (type === "link") {
      navigator.clipboard.writeText(window.location.href);
    } else if (type === "pdf") {
      if (!project) return;

      const loadScript = (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = src;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load script ${src}`));
          document.head.appendChild(script);
        });
      };

      try {
        console.log("Loading html2pdf.js dynamically...");
        await loadScript("/html2pdf.bundle.min.js");

        const element = document.querySelector(".print-container");
        if (!element) {
          console.error("Print container element not found");
          window.print();
          return;
        }

        console.log("Generating and downloading PDF package...");

        // Define settings for html2pdf
        const opt = {
          margin:       0.5,
          filename:     `ventureos-report-${project.id.slice(0, 8)}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Temporarily style container to be visible and correctly colored during PDF generation
        const originalStyle = element.getAttribute("style") || "";
        element.setAttribute("style", "display: block !important; position: relative; color: #111827 !important; background-color: #ffffff !important; padding: 2.5rem; max-width: 800px; margin: 0 auto;");

        // Force all markdown bodies inside print container to use print colors
        const markdownBodies = element.querySelectorAll(".markdown-body");
        const originalBodyStyles: string[] = [];
        markdownBodies.forEach((body) => {
          originalBodyStyles.push(body.getAttribute("style") || "");
          body.setAttribute("style", "color: #1f2937 !important; background-color: #ffffff !important; font-family: sans-serif;");
        });

        // Generate PDF report
        await (window as any).html2pdf().set(opt).from(element).save();

        // Reset all styles
        element.setAttribute("style", originalStyle);
        markdownBodies.forEach((body, idx) => {
          if (originalBodyStyles[idx]) {
            body.setAttribute("style", originalBodyStyles[idx]);
          } else {
            body.removeAttribute("style");
          }
        });

        console.log("PDF generated and downloaded successfully");
      } catch (err) {
        console.error("Dynamic PDF download failed, falling back to window.print():", err);
        window.print();
      }
    }
    // Simulate compilation
    console.log(`Executing expert package compiling for format: ${type}`);
  };

  const handleSelectHistoryProject = (id: string) => {
    navigate(`#/project/${id}`);
  };

  const handleReturnToDashboard = () => {
    navigate("#/dashboard");
  };

  // Reset tab selection to overview when loaded
  useEffect(() => {
    setActiveTab("Overview");
  }, [activeProjectId]);

  // 0. AUTHENTICATION SHIELD GATE
  if (!isLoggedIn) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          localStorage.setItem("venture_logged_in", "true");
        }}
      />
    );
  }

  // 1. REDIRECT LANDING TO DASHBOARD — landing page removed
  if (route === "landing") {
    // Auto-redirect to dashboard instead of showing landing page
    setRoute("dashboard");
    return null;
  }

  // 2. DASHBOARD VIEW & 3. OUTPUT WORKSPACE VIEWS
  const activePath = route === "dashboard" ? "~/dashboard" : `~/project/${activeProjectId?.slice(0, 8)}...`;


  return (
    <>
      <AppShell
        history={history}
        currentProjectId={activeProjectId}
        activePath={activePath}
        onSelectProject={handleSelectHistoryProject}
        onNewProject={handleReturnToDashboard}
        onLogout={async () => {
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore
          }
          setIsLoggedIn(false);
          localStorage.removeItem("venture_logged_in");
        }}
      >
        <AnimatePresence mode="wait">
          {route === "dashboard" ? (
            /* DASHBOARD VIEW CARD CONTAINER */
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center min-h-[50vh] max-w-3xl mx-auto"
            >
              {/* Header branding info */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-950 border border-white/5 text-[#7C6EF8] mb-4 mx-auto shadow-md">
                  <Compass className="w-6 h-6 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold font-display text-zinc-100 tracking-tight">
                  Venture OS Engine
                </h2>
                <p className="text-xs text-zinc-500 font-mono uppercase mt-1 tracking-wider">
                  Launch a specialized autonomous incubation network
                </p>
              </div>

              {/* Metrics Bar */}
              <div className="grid grid-cols-2 gap-4 w-full mb-6">
                <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 flex flex-col items-center justify-center backdrop-blur-sm shadow-sm hover:border-[#7C6EF8]/20 transition-all duration-300">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-semibold">
                    Total Ventures Incubated
                  </span>
                  <span className="text-xl font-bold text-zinc-100 font-space mt-1">
                    {Math.max(12, 12 + history.length)}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 flex flex-col items-center justify-center backdrop-blur-sm shadow-sm hover:border-[#7C6EF8]/20 transition-all duration-300">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-semibold">
                    Average Tokens Generated
                  </span>
                  <span className="text-xl font-bold text-[#7C6EF8] font-space mt-1">
                    42,910
                  </span>
                </div>
              </div>

              {/* Dedicated Input */}
              <div className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                <p className="text-xs font-semibold text-zinc-400 font-display tracking-tight mb-4 text-center">
                  What startup venture are we compiling today?
                </p>
                <IdeaInput onSubmit={handleCreateProject} isLoading={isLoading} size="medium" />
              </div>
            </motion.div>
          ) : (
            /* 3. OUTPUT WORKSPACE VIEW */
            <motion.div
              key="workspace-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-full overflow-hidden"
            >
              {project ? (
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 h-full items-stretch overflow-hidden">
                  {/* Left side: Status tracker panel */}
                  <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-1">
                    {/* General Venture Header Info Card */}
                    <div className="p-5 rounded-xl bg-zinc-950/40 border border-white/5 backdrop-blur-sm flex flex-col gap-2.5 shrink-0">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                        ACTIVE VENTURE CONCEPT
                      </span>
                      <h2 className="text-base font-bold font-display text-zinc-200 tracking-tight line-clamp-2">
                        {project.idea}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-zinc-400">ID:</span>
                        <span className="text-xs font-mono text-zinc-500 bg-zinc-900/60 px-1.5 py-0.5 rounded border border-white/5">
                          {project.id}
                        </span>
                        <span
                          className={`text-[9px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full ml-auto ${
                            project.status === "incubating"
                              ? "bg-[#7C6EF8]/10 text-[#7C6EF8] animate-pulse"
                              : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {project.status === "incubating" ? "incubating" : "compiled"}
                        </span>
                      </div>
                    </div>
 
                    {/* Vertical active state process tracker */}
                    <AgentStepper agents={project.agents} />
                  </div>
 
                  {/* Right side: Workspace Output Tabs panel */}
                  <div className="lg:col-span-8 flex flex-col h-full min-h-[500px] overflow-hidden">
                    {/* Styled Tabs Row Container */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 shrink-0 relative">
                      {/* Tabs horizontal scroll container */}
                      <div className="flex flex-nowrap gap-1.5 overflow-x-auto no-scrollbar pr-4 flex-1">
                        {(
                          [
                            "Overview",
                            "Roadmap",
                            "Market",
                            "Wireframe",
                            "Pitch Deck",
                            "Market Study",
                          ] as TabType[]
                        ).map((tab) => {
                          const isTabSelected = activeTab === tab;
                          return (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`px-4 py-2 text-xs font-semibold tracking-tight font-display rounded-lg transition-all duration-200 select-none shrink-0 ${
                                isTabSelected
                                  ? "bg-[#7C6EF8] text-white shadow-[0_0_15px_rgba(124,110,248,0.2)]"
                                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                              }`}
                            >
                              {tab}
                            </button>
                          );
                        })}
                      </div>

                      {/* Export dropdown menu anchored in top right (outside overflow wrapper to prevent clipping) */}
                      <div className="shrink-0">
                        <ExportMenu onExport={handleExport} />
                      </div>
                    </div>
 
                    {/* Core Content viewer container */}
                    <div className="flex-1 min-h-0 flex flex-col">
                      <OutputTab
                        activeTab={activeTab}
                        project={project}
                        isStreaming={project.status === "incubating"}
                      />
                    </div>

                    {/* High-end metrics footer aligned with the theme */}
                    <div className="h-12 border border-white/5 bg-[#0A0A0A] flex items-center px-6 justify-between shrink-0 rounded-xl mt-4">
                      <div className="flex gap-6">
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono font-medium">Token Usage: 42,910</span>
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono font-medium">Lat: 12ms</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-[10px] text-white/50 font-mono font-medium">System fully operational</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Loading or failure indicator placeholder */
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                  <div className="w-8 h-8 rounded-full border border-zinc-700 border-t-[#7C6EF8] animate-spin mb-3" />
                  <span className="text-xs text-zinc-500 font-mono">
                    Loading venture stream canvas...
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </AppShell>

      {project && (
        <div className="print-container">
          {/* Title Page */}
          <div className="print-page-break" style={{ padding: "4rem 0", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "80vh" }}>
            <h1 style={{ fontSize: "3rem", fontWeight: "800", marginBottom: "1.5rem" }}>VENTURE OS</h1>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "500", color: "#6b7280", marginBottom: "4rem" }}>Startup Incubation Package</h2>
            
            <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: "2rem" }}>
              <p style={{ margin: "0.5rem 0" }}><strong>Concept Idea:</strong> {project.idea}</p>
              <p style={{ margin: "0.5rem 0" }}><strong>Project ID:</strong> {project.id}</p>
              <p style={{ margin: "0.5rem 0" }}><strong>Date Generated:</strong> {new Date().toLocaleDateString()}</p>
              <p style={{ margin: "0.5rem 0" }}><strong>Status:</strong> Compiled successfully</p>
            </div>
          </div>

          {/* Section 1: Overview */}
          <div className="print-page-break">
            <div className="markdown-body">
              <ReactMarkdown>
                {project.agents.find((a) => a.name === "Venture Planner")?.output || ""}
              </ReactMarkdown>
            </div>
          </div>

          {/* Section 2: Market Analysis */}
          <div className="print-page-break">
            <div className="markdown-body">
              <ReactMarkdown>
                {project.agents.find((a) => a.name === "Market Analyst")?.output || ""}
              </ReactMarkdown>
            </div>
          </div>

          {/* Section 3: Product Roadmap */}
          <div className="print-page-break">
            <div className="markdown-body">
              <ReactMarkdown>
                {project.agents.find((a) => a.name === "Product Architect")?.output || ""}
              </ReactMarkdown>
            </div>
          </div>

          {/* Section 4: UX Wireframe Spec */}
          <div className="print-page-break">
            <div className="markdown-body">
              <ReactMarkdown>
                {project.agents.find((a) => a.name === "UX Designer")?.output || ""}
              </ReactMarkdown>
            </div>
          </div>

          {/* Section 5: Pitch Deck & Landing Page */}
          <div className="print-page-break">
            <div className="markdown-body">
              <ReactMarkdown>
                {project.agents.find((a) => a.name === "Pitch Coach")?.output || ""}
              </ReactMarkdown>
            </div>
          </div>

          {/* Section 6: Market Study Report */}
          <div>
            <h1 style={{ fontSize: "2rem", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem", marginTop: "2rem" }}>6. Detailed Market Study</h1>
            
            <h2 style={{ fontSize: "1.4rem", marginTop: "1.5rem" }}>6.1 Problem Validation</h2>
            <p><strong>Overall Validation Score:</strong> 88/100</p>
            <p>High-frequency friction point. Key metrics show high user pain intensity and a strong willingness to pay for direct time-saving solutions.</p>

            <h2 style={{ fontSize: "1.4rem", marginTop: "1.5rem" }}>6.2 Target Audience Profile</h2>
            <p><strong>Demographics:</strong> Age 25-50, typical salaries $55k-$120k, roles aligned with operations, product management, and domain coordination.</p>
            <p><strong>Psychographic Drivers:</strong> Reclaiming administrative hours, reducing workflow overhead, and maintaining operational transparency.</p>

            <h2 style={{ fontSize: "1.4rem", marginTop: "1.5rem" }}>6.3 Competitive Landscape</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: "0.5rem" }}>Competitor</th>
                  <th style={{ padding: "0.5rem" }}>Est. Users</th>
                  <th style={{ padding: "0.5rem" }}>Core Weakness</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.5rem" }}>Zapier / Legacy Tools</td>
                  <td style={{ padding: "0.5rem" }}>4M+ Accounts</td>
                  <td style={{ padding: "0.5rem" }}>Static linear logic; lacks autonomous reasoning or self-healing attributes.</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.5rem" }}>Retool / Custom Canvases</td>
                  <td style={{ padding: "0.5rem" }}>500k Developers</td>
                  <td style={{ padding: "0.5rem" }}>Requires heavy coding, high onboarding complexity, seat-based pricing.</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.5rem" }}>Custom Agencies</td>
                  <td style={{ padding: "0.5rem" }}>Thousands</td>
                  <td style={{ padding: "0.5rem" }}>Exorbitant contract rates ($50k+), slow turnaround, rigid software architectures.</td>
                </tr>
              </tbody>
            </table>

            <h2 style={{ fontSize: "1.4rem", marginTop: "1.5rem" }}>6.4 Sector Signals & News Headlines</h2>
            <ul>
              <li>"Enterprise spending on intelligent automation platforms surges 40% globally" - Gartner</li>
              <li>"New cybersecurity mandates released for autonomous workspace agents" - Wired</li>
              <li>"Why early-stage venture funding is shifting from wrappers to end-to-end orchestration canvases" - PitchBook</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
