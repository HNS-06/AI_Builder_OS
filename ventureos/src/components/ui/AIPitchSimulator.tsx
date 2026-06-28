import React, { useState } from "react";
import { Project } from "../../types";
import { 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  Zap, 
  MessageSquareCode, 
  UserCheck, 
  Activity, 
  Gauge,
  ArrowRight
} from "lucide-react";

interface AIPitchSimulatorProps {
  project: Project;
}

interface ScorecardItem {
  criteria: string;
  score: number;
  feedback: string;
}

interface VCQuestion {
  question: string;
  why: string;
  advice: string;
}

interface EvaluationResult {
  verdict: string;
  scorecard: ScorecardItem[];
  questions: VCQuestion[];
}

export default function AIPitchSimulator({ project }: AIPitchSimulatorProps) {
  const [pitchText, setPitchText] = useState("");
  const [personality, setPersonality] = useState<"balanced" | "optimist" | "skeptic">("balanced");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitchText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/simulate-pitch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea: project.idea,
          pitch: pitchText.trim(),
          personality,
        }),
      });
      const data = await response.json();
      if (data) {
        setResult(data);
      }
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-zinc-300">
      
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/30 p-4 border border-white/5 rounded-xl">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 font-display">
            AI VC Pitch Simulator & Evaluator
          </h3>
          <p className="text-xs text-zinc-500 font-mono uppercase mt-0.5 tracking-wider">
            Test your idea and pitch against Silicon Valley VC minds
          </p>
        </div>
        
        {/* Upper Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 py-1.5 rounded-lg bg-[#7C6EF8]/10 border border-[#7C6EF8]/20 text-[10px] font-mono font-semibold text-[#7C6EF8] tracking-widest uppercase shrink-0 self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Active Simulation Node</span>
        </div>
      </div>

      {/* Input Pitch and Persona Selection */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Card: Input Board */}
        <div className="md:col-span-5 p-5 bg-zinc-900/20 border border-white/5 rounded-xl flex flex-col gap-5 h-fit">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
            VC Persona Profiles
          </span>

          {/* Persona selector list */}
          <div className="flex flex-col gap-2">
            {[
              {
                id: "optimist",
                name: "Marc (The Techno-Optimist)",
                desc: "High-conviction, focuses on massive hardware/AI scales and radical developer leverage.",
              },
              {
                id: "balanced",
                name: "Sarah (The SaaS Partner)",
                desc: "Balanced, seeks immediate customer wedging, PLG loops, and high operational retention.",
              },
              {
                id: "skeptic",
                name: "Alex (The Pragmatic Seed Partner)",
                desc: "Rigorous skeptic, probes technical bottlenecks, CAC, moats, and competitive defensibility.",
              },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonality(p.id as any)}
                className={`p-3 text-left rounded-lg border text-xs transition-all ${
                  personality === p.id
                    ? "bg-[#7C6EF8]/10 border-[#7C6EF8] text-white"
                    : "bg-zinc-950/60 border-white/5 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="font-semibold">{p.name}</div>
                <div className="text-[10px] text-zinc-500 mt-1 leading-normal font-sans">{p.desc}</div>
              </button>
            ))}
          </div>

          {/* Input elevator pitch */}
          <form onSubmit={handleSimulate} className="flex flex-col gap-3">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              Founder Elevator Pitch
            </span>
            <textarea
              value={pitchText}
              onChange={(e) => setPitchText(e.target.value)}
              placeholder="Paste or write your startup elevator pitch here. Be descriptive about your wedge strategy, target customer base, and technical advantage..."
              className="w-full h-32 p-3 text-xs bg-zinc-950 border border-white/5 rounded-lg focus:border-[#7C6EF8] outline-none text-zinc-200 font-sans leading-relaxed resize-none"
            />
            
            <button
              type="submit"
              disabled={loading || !pitchText.trim()}
              className="w-full py-2.5 bg-[#7C6EF8] text-white rounded-lg text-xs font-bold hover:bg-opacity-90 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border border-white/30 border-t-white animate-spin" />
                  <span>Synthesizing Investment Thesis...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Initiate VC Simulation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Card: Feedback / Scorecard */}
        <div className="md:col-span-7 flex flex-col gap-6 min-h-[400px]">
          {result ? (
            <div className="flex flex-col gap-6">
              
              {/* Scorecard Visual List */}
              <div className="p-5 bg-zinc-900/20 border border-white/5 rounded-xl flex flex-col gap-4">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#7C6EF8]" /> Venture Scorecard Critique
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.scorecard.map((card, idx) => (
                    <div key={idx} className="p-3 bg-zinc-950 border border-white/5 rounded-lg flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-zinc-200">{card.criteria}</span>
                        <span className="text-xs font-mono font-bold text-[#7C6EF8]">{card.score}/100</span>
                      </div>
                      {/* Bar indicator */}
                      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#7C6EF8] to-indigo-500 rounded-full"
                          style={{ width: `${card.score}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 font-sans leading-relaxed mt-1">
                        {card.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verdict Text Callout */}
              <div className="p-5 bg-[#7C6EF8]/5 border border-[#7C6EF8]/10 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C6EF8]/5 blur-[40px] rounded-full pointer-events-none" />
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <UserCheck className="w-3.5 h-3.5 text-[#7C6EF8]" /> Partner Verdict Consensus
                </span>
                <p className="text-xs italic text-zinc-200 leading-relaxed font-sans font-medium">
                  "{result.verdict}"
                </p>
              </div>

              {/* Tough simulated follow-up questions */}
              <div className="p-5 bg-zinc-900/20 border border-white/5 rounded-xl flex flex-col gap-4">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquareCode className="w-3.5 h-3.5 text-[#7C6EF8]" /> High-Stakes Follow-Up Questions
                </span>

                <div className="flex flex-col gap-4">
                  {result.questions.map((q, idx) => (
                    <div key={idx} className="p-3.5 bg-zinc-950 border border-white/5 rounded-lg flex flex-col gap-2">
                      <div className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#7C6EF8]/10 border border-[#7C6EF8]/30 text-[#7C6EF8] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                          0{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-100 font-sans">{q.question}</h4>
                          <p className="text-[10px] text-zinc-500 font-sans leading-relaxed mt-1">
                            <span className="font-semibold text-zinc-400 font-mono uppercase text-[9px]">Why VCs ask:</span> {q.why}
                          </p>
                        </div>
                      </div>
                      
                      {/* Coach Answer Advice */}
                      <div className="mt-1 pl-7 border-l border-[#7C6EF8]/20 flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-[#7C6EF8] font-bold uppercase tracking-wider flex items-center gap-1">
                          Coach Recommended Answer Direction <ArrowRight className="w-3 h-3" />
                        </span>
                        <p className="text-[10px] text-zinc-400 font-sans leading-relaxed italic">
                          "{q.advice}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 p-6 bg-zinc-900/10 border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 mb-3">
                <HelpCircle className="w-5 h-5" />
              </div>
              <p className="text-xs text-zinc-500 font-sans max-w-[240px] leading-relaxed">
                Choose a VC Partner persona, write your elevator pitch, and press "Initiate VC Simulation" to begin critique.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
