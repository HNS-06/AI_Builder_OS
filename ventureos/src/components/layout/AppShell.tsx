import { ReactNode } from "react";
import SidePanel from "./SidePanel";
import TopBar from "./TopBar";
import { ProjectHistoryItem } from "../../types";

interface AppShellProps {
  children: ReactNode;
  history: ProjectHistoryItem[];
  currentProjectId?: string;
  activePath?: string;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onLogout?: () => void;
}

export default function AppShell({
  children,
  history,
  currentProjectId,
  activePath,
  onSelectProject,
  onNewProject,
  onLogout,
}: AppShellProps) {
  return (
    <div className="flex h-screen w-screen bg-[#0A0A0A] overflow-hidden select-none">
      {/* Side Panel Drawer list */}
      <SidePanel
        history={history}
        currentProjectId={currentProjectId}
        onSelectProject={onSelectProject}
        onNewProject={onNewProject}
        onLogout={onLogout}
      />

      {/* Main Panel grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Controls */}
        <TopBar onNewProject={onNewProject} activePath={activePath} currentProjectId={currentProjectId} />

        {/* Core Screen Container */}
        <div className="flex-1 overflow-hidden bg-[#0A0A0A] relative p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
