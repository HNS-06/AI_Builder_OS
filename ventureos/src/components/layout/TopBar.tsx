import { Compass, Plus, User, Sparkles, LogOut } from "lucide-react";

interface TopBarProps {
  onNewProject: () => void;
  activePath?: string;
  currentProjectId?: string;
}

export default function TopBar({ onNewProject, activePath = "~/", currentProjectId }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-white/5">
      {/* Route Directory Name */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-zinc-500">SYSTEM:</span>
        <span className="text-xs font-mono text-zinc-300 bg-zinc-900 px-2 py-0.75 rounded border border-white/5">
          {activePath}
        </span>
      </div>

      {/* Pulsating Theme Badge */}
      <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs font-mono uppercase tracking-widest text-white/60">
          {currentProjectId 
            ? `Project: ${currentProjectId.slice(0, 8).toUpperCase()}_INC`
            : "System: Online"
          }
        </span>
      </div>

      {/* Header Quick Controls */}
      <div className="flex items-center gap-4">
        {/* Quick Compile CTA */}
        <button
          onClick={onNewProject}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7C6EF8]/10 hover:bg-[#7C6EF8]/20 border border-[#7C6EF8]/20 hover:border-[#7C6EF8]/40 text-xs font-semibold tracking-tight font-display text-[#7C6EF8] rounded-md transition-all duration-200 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>NEW PROJECT</span>
        </button>

        {/* User Badge Profile Avatar */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/5">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 border border-white/20"></div>
          <span className="text-xs font-medium text-zinc-400 font-display hidden sm:inline">
            Admin
          </span>
        </div>
      </div>
    </div>
  );
}
