import { ProjectHistoryItem } from "../../types";
import { Compass, Plus, History, Sparkles, FolderDot, ArrowRight, LogOut } from "lucide-react";
import { motion } from "motion/react";

interface SidePanelProps {
  history: ProjectHistoryItem[];
  currentProjectId?: string;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onLogout?: () => void;
  isOpen?: boolean;
}

export default function SidePanel({
  history,
  currentProjectId,
  onSelectProject,
  onNewProject,
  onLogout,
  isOpen = true,
}: SidePanelProps) {
  return (
    <div
      className={`flex flex-col h-screen w-64 bg-zinc-950 border-r border-white/5 transition-all duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-zinc-950/40">
        <div
          onClick={onNewProject}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#7C6EF8]/10 border border-[#7C6EF8]/20 group-hover:border-[#7C6EF8]/50 transition-colors duration-300">
            <Compass className="w-4 h-4 text-[#7C6EF8] group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight font-display text-white">
              VentureOS
            </span>
            <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">
              Incubation Suite
            </span>
          </div>
        </div>
      </div>

      {/* New Project CTA */}
      <div className="p-4">
        <button
          onClick={onNewProject}
          className="flex items-center justify-between w-full px-4 py-3 bg-zinc-900/60 hover:bg-[#7C6EF8] text-zinc-300 hover:text-white border border-white/5 hover:border-transparent rounded-lg text-xs font-semibold tracking-tight font-display transition-all duration-300 active:scale-98 shadow-sm group"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>NEW INCUBATION</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
        </button>
      </div>

      {/* History Core Scroll List */}
      <div className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 px-4 pb-2 mb-2 text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-widest border-b border-white/5">
          <History className="w-3.5 h-3.5" />
          <span>Venture Log</span>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center mt-4">
            <FolderDot className="w-6 h-6 text-zinc-700 mb-2" />
            <span className="text-xs text-zinc-600 font-mono">
              Empty terminal. Describe an idea to compile your first venture.
            </span>
          </div>
        ) : (
          history.map((item) => {
            const isSelected = item.id === currentProjectId;

            return (
              <button
                key={item.id}
                onClick={() => onSelectProject(item.id)}
                className={`relative flex flex-col items-start w-full px-4 py-3 text-left rounded-lg transition-all duration-200 overflow-hidden select-none before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-[#7C6EF8] before:rounded-r before:origin-center before:transition-transform before:duration-300 ${
                  isSelected
                    ? "bg-[#7C6EF8]/5 text-white before:scale-y-100"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 before:scale-y-0 hover:before:scale-y-75"
                }`}
              >
                <span className="text-xs font-medium font-display tracking-tight truncate w-full">
                  {item.idea}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono mt-1">
                  {item.timestamp}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Premium Runtime Stats Tracker Widget */}
      <div className="p-4 mx-3 mb-3 rounded-xl bg-white/[0.03] border border-white/5 shadow-sm">
        <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-2 font-mono font-semibold">Runtime Stats</p>
        <div className="flex justify-between text-xs font-mono">
          <span className="text-zinc-500">Processing Power</span>
          <span className="text-[#7C6EF8]">82%</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div className="w-[82%] h-full bg-[#7C6EF8] rounded-full"></div>
        </div>
      </div>

      {/* User Session Footer Badge */}
      <div className="p-4 border-t border-white/5 bg-zinc-950/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 border border-white/10 text-[#7C6EF8] text-xs font-mono font-bold shrink-0">
              OS
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-300 truncate font-display">
                Venture Lab Alpha
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                Status: Connected
              </span>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Disconnect session"
              className="p-1.5 rounded-md hover:bg-zinc-900 text-zinc-500 hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
