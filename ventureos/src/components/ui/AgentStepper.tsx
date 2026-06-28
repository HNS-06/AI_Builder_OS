import { Sparkles } from "lucide-react";
import { ProjectAgent } from "../../types";

interface AgentStepperProps {
  agents: ProjectAgent[];
}

export default function AgentStepper({ agents }: AgentStepperProps) {
  // Map agent name to professional aesthetic roles and descriptions from the design guide
  const getAgentThemeDetails = (name: string) => {
    switch (name) {
      case "Venture Planner":
        return {
          title: "Strategy Architect",
          sub: "Foundational logic solidified",
          activeSub: "Formulating business thesis...",
          waitingSub: "Awaiting workspace initialization"
        };
      case "Market Analyst":
        return {
          title: "Market Intelligence",
          sub: "TAM/SAM/SOM validated",
          activeSub: "Running competitive analytics...",
          waitingSub: "Awaiting strategy completion"
        };
      case "Product Architect":
        return {
          title: "Product Lead",
          sub: "MVP specifications generated",
          activeSub: "Drafting MVP roadmap...",
          waitingSub: "Awaiting intelligence metrics"
        };
      case "UX Designer":
        return {
          title: "Interface Designer",
          sub: "Grid wireframes designed",
          activeSub: "Constructing Swiss layouts...",
          waitingSub: "Awaiting product spec verification"
        };
      case "Growth Strategist":
        return {
          title: "Growth Strategist",
          sub: "GTM plan finalized",
          activeSub: "Formulating acquisition loops...",
          waitingSub: "Awaiting UX guidelines"
        };
      case "Pitch Coach":
        return {
          title: "Investor Liaison",
          sub: "Investor assets finalized",
          activeSub: "Synthesizing investor deck...",
          waitingSub: "Awaiting full design system"
        };
      default:
        return {
          title: name,
          sub: "Analysis complete",
          activeSub: "Processing...",
          waitingSub: "Pending execution"
        };
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 rounded-xl bg-zinc-950/40 border border-white/5 backdrop-blur-sm">
      <div className="flex items-center gap-2 pb-4 border-b border-white/5">
        <Sparkles className="w-4 h-4 text-[#7C6EF8]" />
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-semibold font-mono">
          Incubation Progress
        </h3>
      </div>

      <div className="relative flex flex-col ml-2 mt-2">
        {agents.map((agent, idx) => {
          const isActive = agent.status === "active";
          const isCompleted = agent.status === "completed";
          const isWaiting = agent.status === "waiting";
          const isLast = idx === agents.length - 1;

          const details = getAgentThemeDetails(agent.name);

          return (
            <div
              key={idx}
              className={`flex gap-4 relative ${!isLast ? "pb-8 border-l border-white/10" : ""} ml-1`}
            >
              {/* Vertical timeline dot element tailored precisely to the design guide */}
              {isCompleted ? (
                <div className="absolute -left-[5px] top-0.5 w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              ) : isActive ? (
                <div className="absolute -left-[9px] -top-1 w-4.5 h-4.5 rounded-full border-4 border-[#0A0A0A] bg-[#7C6EF8] ring-1 ring-[#7C6EF8] animate-pulse" />
              ) : (
                <div className="absolute -left-[5px] top-0.5 w-2.5 h-2.5 rounded-full bg-white/10" />
              )}

              {/* Text context with custom offsets */}
              <div className="pl-6 -mt-1 flex flex-col min-w-0">
                <span
                  className={`text-sm font-semibold tracking-tight transition-colors ${
                    isActive
                      ? "text-[#7C6EF8]"
                      : isWaiting
                      ? "text-white/30"
                      : "text-zinc-200"
                  }`}
                >
                  {details.title}
                </span>
                
                <span
                  className={`text-xs mt-1 transition-all duration-300 ${
                    isActive
                      ? "text-white/60 italic"
                      : isWaiting
                      ? "text-white/20"
                      : "text-white/40"
                  }`}
                >
                  {isActive
                    ? details.activeSub
                    : isCompleted
                    ? details.sub
                    : details.waitingSub}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

