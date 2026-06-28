import React, { useState } from "react";
import { Project } from "../../types";
import { 
  Monitor, 
  Smartphone, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Box, 
  Lock, 
  ArrowRight, 
  Search, 
  Bell, 
  CheckCircle,
  Plus,
  Play
} from "lucide-react";

interface InteractiveUXPreviewProps {
  project: Project;
}

export default function InteractiveUXPreview({ project }: InteractiveUXPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [items, setItems] = useState<string[]>([
    "Process Automated Data ingestion",
    "Analyze Q3 customer churn indices",
    "Map localized logistics streams",
  ]);
  const [newItemText, setNewItemText] = useState("");
  const [clickCount, setClickCount] = useState(0);

  // Derive title from idea
  const title = project.idea
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "Startup Canvas";

  // Classify startup type for tailored mock layout
  const lowerIdea = project.idea.toLowerCase();
  let startupCategory: "saas" | "marketplace" | "developer" | "consumer" = "saas";
  if (lowerIdea.includes("dev") || lowerIdea.includes("code") || lowerIdea.includes("api") || lowerIdea.includes("terminal")) {
    startupCategory = "developer";
  } else if (lowerIdea.includes("market") || lowerIdea.includes("shop") || lowerIdea.includes("hire") || lowerIdea.includes("rent")) {
    startupCategory = "marketplace";
  } else if (lowerIdea.includes("app") || lowerIdea.includes("tracker") || lowerIdea.includes("health") || lowerIdea.includes("fitness")) {
    startupCategory = "consumer";
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setItems([...items, newItemText.trim()]);
    setNewItemText("");
  };

  return (
    <div className="flex flex-col gap-6 w-full text-zinc-300">
      {/* Upper Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/30 p-4 border border-white/5 rounded-xl">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 font-display">
            Interactive UX Prototype Sandbox
          </h3>
          <p className="text-xs text-zinc-500 font-mono uppercase mt-0.5 tracking-wider">
            Live tailored mockup canvas based on your concept
          </p>
        </div>
        
        {/* Responsive Toggle buttons */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-white/5 rounded-lg shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setDevice("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              device === "desktop"
                ? "bg-[#7C6EF8] text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              device === "mobile"
                ? "bg-[#7C6EF8] text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile App</span>
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex justify-center items-center py-6 bg-zinc-950 rounded-2xl border border-white/5 relative overflow-hidden min-h-[500px]">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#7C6EF8]/5 blur-[80px] rounded-full pointer-events-none" />

        <div
          className={`transition-all duration-300 shadow-2xl relative ${
            device === "desktop" 
              ? "w-full max-w-4xl border border-white/10 rounded-xl bg-[#09090B]" 
              : "w-[340px] border-[8px] border-zinc-900 rounded-[32px] bg-[#09090B]"
          }`}
        >
          {device === "mobile" && (
            <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto my-2 absolute top-2 left-1/2 -translate-x-1/2 z-20" />
          )}

          {/* Prototype Frame Content */}
          <div className={`overflow-hidden flex flex-col ${device === "desktop" ? "min-h-[440px]" : "min-h-[540px] pt-8"}`}>
            
            {/* 1. SAAS STYLE LAYOUT */}
            {startupCategory === "saas" && (
              <div className="flex flex-1 flex-col font-sans">
                {/* Dashboard Nav bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0C0C0E]">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-gradient-to-tr from-[#7C6EF8] to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                      {title.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-white tracking-tight">{title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Search className="w-3.5 h-3.5 text-zinc-500" />
                    <Bell className="w-3.5 h-3.5 text-zinc-500" />
                    <div className="w-5 h-5 rounded-full bg-[#7C6EF8]/30 border border-[#7C6EF8]/50 flex items-center justify-center text-[9px] text-white">
                      PM
                    </div>
                  </div>
                </div>

                {/* Dashboard Body */}
                <div className={`flex-1 p-4 ${device === "desktop" ? "grid grid-cols-12 gap-4" : "flex flex-col gap-4"}`}>
                  
                  {/* Stats Cards */}
                  <div className={`${device === "desktop" ? "col-span-12" : ""} grid grid-cols-2 gap-3`}>
                    <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 font-medium">Monthly Runs</span>
                        <div className="text-base font-bold text-white mt-0.5">14,812</div>
                      </div>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 font-medium">Efficiency Index</span>
                        <div className="text-base font-bold text-white mt-0.5">99.8%</div>
                      </div>
                      <CheckCircle className="w-4 h-4 text-[#7C6EF8]" />
                    </div>
                  </div>

                  {/* Left Side: Interactive Queue Control */}
                  <div className={`${device === "desktop" ? "col-span-7" : ""} p-4 rounded-lg bg-zinc-900/30 border border-white/5 flex flex-col gap-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Execution Hub Queue</span>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                        Active
                      </span>
                    </div>

                    {/* Interactive Input */}
                    <form onSubmit={handleAddItem} className="flex gap-2">
                      <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Add new custom workflow step..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-zinc-950 border border-white/5 rounded-md focus:border-[#7C6EF8] outline-none"
                      />
                      <button
                        type="submit"
                        className="px-2.5 bg-[#7C6EF8] text-white rounded-md hover:bg-opacity-90 flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {/* Dynamic List */}
                    <div className="flex flex-col gap-1.5">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-white/5 text-xs">
                          <span className="text-zinc-300">{item}</span>
                          <span className="text-[9px] text-[#7C6EF8] font-mono uppercase">Pending</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Side: Flow Visualization */}
                  <div className={`${device === "desktop" ? "col-span-5" : ""} p-4 rounded-lg bg-zinc-900/30 border border-white/5 flex flex-col gap-3 items-center justify-center text-center`}>
                    <div className="w-10 h-10 rounded-full bg-[#7C6EF8]/10 border border-[#7C6EF8]/30 flex items-center justify-center text-[#7C6EF8] animate-bounce">
                      <Box className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-200">Autonomous Core Active</h4>
                    <p className="text-[11px] text-zinc-500 max-w-[200px] leading-relaxed">
                      Continuous intelligence orchestration mapping live API streams.
                    </p>
                    <button 
                      onClick={() => setClickCount(c => c + 1)}
                      className="mt-1 px-3 py-1.5 text-xs bg-zinc-900 border border-white/10 hover:border-[#7C6EF8]/30 rounded text-zinc-300 flex items-center gap-1 hover:text-[#7C6EF8] transition-all"
                    >
                      <Play className="w-3 h-3" />
                      <span>Ping System ({clickCount})</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. DEVELOPER / TERMINAL STYLE LAYOUT */}
            {startupCategory === "developer" && (
              <div className="flex flex-1 flex-col font-mono text-xs">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    <span className="text-[10px] text-zinc-500 ml-2">forgeOS -- {title.toLowerCase().replace(/ /g, "-")}</span>
                  </div>
                  <Lock className="w-3 h-3 text-zinc-600" />
                </div>

                {/* Terminal Workspace */}
                <div className="flex-1 p-4 bg-[#08080A] flex flex-col gap-3">
                  <div className="text-zinc-500">
                    # Seed package loaded. Starting local development runtime...
                  </div>
                  <div className="flex items-center gap-2 text-[#7C6EF8]">
                    <span>$</span>
                    <span className="text-zinc-100">npm run deploy --env=production</span>
                  </div>

                  <div className="p-3 bg-zinc-950 border border-white/5 rounded-md font-mono flex flex-col gap-1.5 text-zinc-400">
                    <div>&gt; Loading database cluster: <span className="text-emerald-400">ONLINE</span></div>
                    <div>&gt; Injecting multi-agent environment: <span className="text-[#7C6EF8]">READY</span></div>
                    <div>&gt; Operational API proxy: <span className="text-zinc-500">http://localhost:3000/api/v1</span></div>
                  </div>

                  {/* Interactive Input Form */}
                  <form onSubmit={handleAddItem} className="flex gap-2 border-t border-white/5 pt-3 mt-auto">
                    <span className="text-[#7C6EF8] font-bold">&gt;&gt;</span>
                    <input
                      type="text"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Type custom action execution command..."
                      className="flex-1 bg-transparent text-zinc-200 border-none outline-none text-xs"
                    />
                  </form>

                  {/* Output Log stream */}
                  <div className="max-h-24 overflow-y-auto flex flex-col gap-1 text-[11px] text-zinc-500">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-1.5">
                        <span className="text-emerald-500">[OK]</span>
                        <span>Executed: {item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. MARKETPLACE / GRID LAYOUT */}
            {startupCategory === "marketplace" && (
              <div className="flex flex-1 flex-col font-sans">
                {/* Marketplace Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#0C0C0E] border-b border-white/5">
                  <span className="text-xs font-bold text-white tracking-widest uppercase">{title}</span>
                  <div className="px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-md text-[10px] text-[#7C6EF8] font-semibold">
                    Cart (0)
                  </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 p-4 bg-[#08080A] flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-semibold text-zinc-200">Featured Collections</h4>
                    <span className="text-[10px] text-zinc-500">Show all</span>
                  </div>

                  <div className={`grid ${device === "desktop" ? "grid-cols-3" : "grid-cols-1"} gap-3`}>
                    {[
                      { name: "Premium Enterprise Bundle", price: "$299/mo", rating: "4.9" },
                      { name: "Starter Core Blueprint", price: "$49/mo", rating: "4.8" },
                      { name: "Custom Agent Orchestrator", price: "Custom", rating: "5.0" }
                    ].map((prod, idx) => (
                      <div key={idx} className="p-3 bg-zinc-900/50 border border-white/5 rounded-lg flex flex-col gap-1">
                        <div className="w-full h-20 bg-zinc-950 rounded border border-white/5 flex items-center justify-center text-zinc-600">
                          <Box className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-zinc-200 mt-1.5">{prod.name}</span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-[#7C6EF8] font-mono font-bold">{prod.price}</span>
                          <span className="text-[10px] text-zinc-400">★ {prod.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. APP / TRACKER / CONSUMER LAYOUT */}
            {startupCategory === "consumer" && (
              <div className="flex flex-1 flex-col font-sans">
                {/* Minimalist Mobile App Header */}
                <div className="px-4 pt-4 pb-2 bg-[#0C0C0E] flex flex-col items-center justify-center text-center">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h4>
                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5">HEALTH CORE ENGINE</span>
                </div>

                {/* Health Graph and Data Ring */}
                <div className="flex-1 p-4 bg-[#08080A] flex flex-col gap-4 items-center justify-center">
                  {/* Circle ring visual */}
                  <div className="relative w-28 h-28 rounded-full border-[6px] border-[#7C6EF8]/10 flex flex-col items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[6px] border-[#7C6EF8] border-r-transparent animate-spin-slow" />
                    <span className="text-xs font-mono text-zinc-400">DAILY GOAL</span>
                    <span className="text-lg font-bold text-white">84%</span>
                  </div>

                  {/* Sub stats row */}
                  <div className="grid grid-cols-2 gap-3 w-full mt-2">
                    <div className="p-2 bg-zinc-900 border border-white/5 rounded-lg text-center">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">Velocity</span>
                      <div className="text-sm font-bold text-white mt-0.5">42 Mbps</div>
                    </div>
                    <div className="p-2 bg-zinc-900 border border-white/5 rounded-lg text-center">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">Activity</span>
                      <div className="text-sm font-bold text-white mt-0.5">Active</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
