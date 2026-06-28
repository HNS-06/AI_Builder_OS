import { Sparkles } from "lucide-react";
import { ProjectAgent } from "../../types";

interface AgentStepperProps {
  agents: ProjectAgent[];
}

export default function AgentStepper({ agents }: AgentStepperProps) {
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
      <style>{`
        @keyframes flowPulse {
          0%, 100% { box-shadow: 0 0 4px rgba(124,110,248,0.4); }
          50% { box-shadow: 0 0 16px rgba(124,110,248,0.8), 0 0 32px rgba(124,110,248,0.3); }
        }
        @keyframes rippleOut {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes completeBurst {
          0% { transform: scale(0.8); opacity: 0; }
          40% { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes flowLine {
          0% { background-position: 0% 0%; }
          100% { background-position: 0% 200%; }
        }
        @keyframes textFadeIn {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .agent-dot-active {
          animation: flowPulse 1.5s ease-in-out infinite;
        }
        .agent-dot-complete {
          animation: completeBurst 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .agent-ripple {
          animation: rippleOut 1.5s ease-out infinite;
        }
        .agent-text-enter {
          animation: textFadeIn 0.4s ease-out forwards;
        }
        .flow-line-active {
          background: linear-gradient(180deg, #7C6EF8 0%, rgba(124,110,248,0.2) 50%, rgba(255,255,255,0.06) 100%);
          background-size: 100% 200%;
          animation: flowLine 2s linear infinite;
        }
        .flow-line-done {
          background: linear-gradient(180deg, rgba(34,197,94,0.3) 0%, rgba(34,197,94,0.6) 50%, rgba(34,197,94,0.3) 100%);
        }
        .flow-line-pending {
          background: rgba(255,255,255,0.06);
        }
      `}</style>

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

          const lineClass = isActive
            ? "flow-line-active"
            : isCompleted
            ? "flow-line-done"
            : "flow-line-pending";

          return (
            <div
              key={idx}
              className={`flex gap-4 relative ml-1 transition-all duration-700 ease-out ${
                !isLast ? "pb-8" : ""
              }`}
            >
              {/* Vertical timeline line */}
              {!isLast && (
                <div
                  className={`absolute left-[5px] top-3 w-[2px] ${lineClass} transition-all duration-700 ease-out`}
                  style={{ height: "calc(100% - 8px)" }}
                />
              )}

              {/* Dot container */}
              <div className="relative flex-shrink-0" style={{ width: 20, height: 20 }}>
                {isCompleted ? (
                  <>
                    <div className="absolute left-[3px] top-[3px] w-3 h-3 rounded-full bg-green-500 agent-dot-complete" />
                    <div className="absolute left-[3px] top-[3px] w-3 h-3 rounded-full bg-green-400/40 agent-ripple" />
                  </>
                ) : isActive ? (
                  <>
                    <div className="absolute left-[1px] top-[1px] w-[18px] h-[18px] rounded-full bg-[#0A0A0A] border-[3px] border-[#7C6EF8] agent-dot-active" />
                    <div className="absolute left-[1px] top-[1px] w-[18px] h-[18px] rounded-full bg-[#7C6EF8]/20 agent-ripple" />
                  </>
                ) : (
                  <div className="absolute left-[5px] top-[5px] w-2.5 h-2.5 rounded-full bg-white/10 transition-all duration-500" />
                )}
              </div>

              {/* Text content */}
              <div className="pl-4 -mt-1 flex flex-col min-w-0">
                <span
                  className={`text-sm font-semibold tracking-tight transition-all duration-500 ease-out ${
                    isActive
                      ? "text-[#7C6EF8]"
                      : isCompleted
                      ? "text-zinc-200"
                      : "text-white/30"
                  }`}
                >
                  {details.title}
                </span>

                <span
                  className={`text-xs mt-1 transition-all duration-500 ease-out ${
                    isActive
                      ? "text-white/60 italic"
                      : isCompleted
                      ? "text-white/40"
                      : "text-white/20"
                  } ${isActive ? "agent-text-enter" : ""}`}
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
