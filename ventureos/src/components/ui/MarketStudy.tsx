import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Project } from "../../types";
import {
  TrendingUp,
  Users,
  Target,
  ShieldAlert,
  Flame,
  ArrowUpRight,
  Award,
  BarChart2,
  Activity,
} from "lucide-react";

interface MarketStudyProps {
  project: Project;
}

interface Competitor {
  name: string;
  funding: string;
  users: string;
  weakness: string;
  strength: string;
}

interface ValidationFactor {
  name: string;
  score: number;
}

interface ParsedMarketData {
  validationScore: number;
  validationFeedback: string;
  validationFactors: ValidationFactor[];
  demographics: {
    age: string;
    salary: string;
    roles: string;
  };
  psychographics: {
    motives: string;
    habits: string;
  };
  competitors: Competitor[];
  signals: string[];
  trendData: number[];
  keyword: string;
}

/** Parse the AI Market Analyst output into structured data for visualizations */
function parseMarketAnalystOutput(output: string): ParsedMarketData {
  const lines = output.split("\n");

  // --- Validation factors ---
  const factorNames = ["Pain Intensity", "Usage Frequency", "Budget Availability", "Willingness to Pay"];
  const validationFactors: ValidationFactor[] = factorNames.map((name) => {
    const factorLine = lines.find((l) => l.toLowerCase().includes(name.toLowerCase()));
    if (factorLine) {
      const match = factorLine.match(/(\d{1,3})\s*\/\s*100/);
      if (match) return { name, score: Math.min(100, parseInt(match[1])) };
    }
    return { name, score: 75 };
  });

  // Overall validation score
  let validationScore = 0;
  const overallLine = lines.find((l) => l.toLowerCase().includes("overall validation score") || l.toLowerCase().includes("overall score"));
  if (overallLine) {
    const match = overallLine.match(/(\d{1,3})\s*\/\s*100/);
    if (match) validationScore = Math.min(100, parseInt(match[1]));
  }
  if (!validationScore) {
    validationScore = Math.round(validationFactors.reduce((sum, f) => sum + f.score, 0) / validationFactors.length);
  }

  // --- Demographics ---
  let roles = "";
  let age = "";
  let salary = "";

  const roleLine = lines.find((l) => l.toLowerCase().includes("primary role") || l.toLowerCase().includes("**primary role**"));
  if (roleLine) roles = roleLine.replace(/.*primary role\*?\*?:?\s*/i, "").replace(/\*\*/g, "").trim();

  const ageLine = lines.find((l) => l.toLowerCase().includes("age range") || l.toLowerCase().includes("**age range**"));
  if (ageLine) age = ageLine.replace(/.*age range\*?\*?:?\s*/i, "").replace(/\*\*/g, "").trim();

  const salaryLine = lines.find((l) =>
    l.toLowerCase().includes("income") || l.toLowerCase().includes("budget") || l.toLowerCase().includes("salary")
  );
  if (salaryLine) salary = salaryLine.replace(/.*(?:income|budget|salary)\*?\*?:?\s*/i, "").replace(/\*\*/g, "").trim().slice(0, 60);

  // --- Psychographics ---
  let motives = "";
  let habits = "";
  const coreMotiveLine = lines.find((l) => l.toLowerCase().includes("core motivation") || l.toLowerCase().includes("motivation"));
  if (coreMotiveLine) motives = coreMotiveLine.replace(/.*(?:core motivation|motivation)\*?\*?:?\s*/i, "").replace(/\*\*/g, "").trim().slice(0, 200);

  const habitsLine = lines.find((l) => l.toLowerCase().includes("adoption habit") || l.toLowerCase().includes("habits"));
  if (habitsLine) habits = habitsLine.replace(/.*(?:adoption habits?)\*?\*?:?\s*/i, "").replace(/\*\*/g, "").trim().slice(0, 200);

  // --- Competitors ---
  const competitors: Competitor[] = [];
  const compSectionIdx = lines.findIndex((l) => l.toLowerCase().includes("top 3 competitor") || l.toLowerCase().includes("competitors"));
  if (compSectionIdx !== -1) {
    // Look for lines with bold company names and | separators
    const compLines = lines.slice(compSectionIdx + 1, compSectionIdx + 40);
    let currentComp: Partial<Competitor> | null = null;

    for (const line of compLines) {
      // Match: **CompanyName** | Funding: $XXX | Users: XXX
      const headerMatch = line.match(/\*\*([^*]+)\*\*\s*\|\s*Funding:\s*([^|]+)\|\s*Users:\s*(.+)/i);
      if (headerMatch) {
        if (currentComp && currentComp.name) competitors.push(currentComp as Competitor);
        currentComp = {
          name: headerMatch[1].trim(),
          funding: headerMatch[2].trim(),
          users: headerMatch[3].trim(),
          strength: "",
          weakness: "",
        };
        continue;
      }
      if (currentComp) {
        const strengthMatch = line.match(/strength:\s*(.+)/i);
        if (strengthMatch) currentComp.strength = strengthMatch[1].replace(/\*\*/g, "").trim();
        const weaknessMatch = line.match(/weakness:\s*(.+)/i);
        if (weaknessMatch) currentComp.weakness = weaknessMatch[1].replace(/\*\*/g, "").trim();
      }
      if (competitors.length >= 3 && currentComp?.weakness) break;
    }
    if (currentComp && currentComp.name) competitors.push(currentComp as Competitor);
  }

  // --- Trend data ---
  let trendData: number[] = [30, 35, 40, 48, 52, 60, 65, 72, 78, 82, 88, 95];
  const trendLine = lines.find((l) => l.includes("TREND_DATA:"));
  if (trendLine) {
    const match = trendLine.match(/TREND_DATA:\s*\[([^\]]+)\]/);
    if (match) {
      const parsed = match[1].split(",").map((n) => parseInt(n.trim())).filter((n) => !isNaN(n));
      if (parsed.length === 12) trendData = parsed;
    }
  }

  // --- Market signals ---
  const signals: string[] = [];
  const signalIdx = lines.findIndex((l) => l.toLowerCase().includes("market signal") || l.toLowerCase().includes("key market signal"));
  if (signalIdx !== -1) {
    for (let i = signalIdx + 1; i < Math.min(signalIdx + 15, lines.length); i++) {
      const l = lines[i].trim();
      if (l.startsWith("-") || l.startsWith("*") || l.match(/^\d+\./)) {
        const clean = l.replace(/^[-*\d.]\s*/, "").replace(/\*\*/g, "").trim();
        if (clean.length > 20) signals.push(clean);
        if (signals.length >= 3) break;
      }
    }
  }

  // --- keyword extraction ---
  const overviewLine = lines.find((l) => l.toLowerCase().includes("market overview"));
  const keyword = overviewLine
    ? overviewLine.replace(/##.*market overview\s*/i, "").trim().split(" ").slice(0, 4).join(" ")
    : project?.idea?.split(" ").slice(0, 3).join(" ") || "Market Analysis";

  // --- Validation feedback ---
  const feedbackIdx = lines.findIndex((l) => l.toLowerCase().includes("problem validation") || l.toLowerCase().includes("validation score"));
  let validationFeedback = "";
  if (feedbackIdx !== -1) {
    for (let i = feedbackIdx + 1; i < Math.min(feedbackIdx + 8, lines.length); i++) {
      const l = lines[i].trim();
      if (l.length > 30 && !l.startsWith("#") && !l.startsWith("-") && !l.match(/^\*\*(Pain|Usage|Budget|Willingness)/)) {
        validationFeedback = l.replace(/\*\*/g, "").trim();
        break;
      }
    }
  }
  if (!validationFeedback) {
    validationFeedback = `This market shows a ${validationScore >= 85 ? "strong" : validationScore >= 70 ? "solid" : "moderate"} problem-solution fit with a validation score of ${validationScore}/100 based on pain intensity, usage frequency, budget availability, and willingness to pay.`;
  }

  return {
    validationScore,
    validationFeedback,
    validationFactors,
    demographics: {
      age: age || "25 - 45 years old",
      salary: salary || "Varies by segment",
      roles: roles || "Industry professionals",
    },
    psychographics: {
      motives: motives || "Solving core operational inefficiencies and reducing manual overhead.",
      habits: habits || "Research tools online, trust peer recommendations, prefer proven solutions.",
    },
    competitors: competitors.length >= 2 ? competitors : [],
    signals,
    trendData,
    keyword,
  };
}

// Declare project at module scope for use inside parseMarketAnalystOutput
let project: Project | null = null;

export default function MarketStudy({ project: p }: MarketStudyProps) {
  project = p;
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 200 });
  const [hoveredTrend, setHoveredTrend] = useState<{ month: string; value: number } | null>(null);

  // Get the Market Analyst agent output
  const marketOutput = p.agents.find((a) => a.name === "Market Analyst")?.output || "";
  const isLoading = p.agents.find((a) => a.name === "Market Analyst")?.status !== "completed";

  const content = parseMarketAnalystOutput(marketOutput);

  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const trendData = months.map((m, i) => ({
    month: m,
    value: content.trendData[i] ?? 50,
  }));

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions({ width: Math.max(width, 300), height: 200 });
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // D3 Chart Rendering
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 25, bottom: 25, left: 35 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scalePoint().domain(months).range([0, chartWidth]);
    const y = d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]);

    const xAxis = d3.axisBottom(x).tickSize(0).tickPadding(8);
    const yAxis = d3.axisLeft(y).ticks(4).tickSize(-chartWidth).tickPadding(8);

    g.append("g")
      .attr("class", "y-grid")
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "rgba(255, 255, 255, 0.03)"))
      .call((g) =>
        g.selectAll(".tick text").attr("fill", "rgba(255, 255, 255, 0.3)").attr("font-size", "9px").attr("font-family", "var(--font-mono)")
      );

    g.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(xAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll("text").attr("fill", "rgba(255, 255, 255, 0.3)").attr("font-size", "9px").attr("font-family", "var(--font-mono)")
      );

    const line = d3
      .line<{ month: string; value: number }>()
      .x((d) => x(d.month) || 0)
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const area = d3
      .area<{ month: string; value: number }>()
      .x((d) => x(d.month) || 0)
      .y0(chartHeight)
      .y1((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const gradientId = `area-gradient-${p.id}`;
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient").attr("id", gradientId).attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    linearGradient.append("stop").attr("offset", "0%").attr("stop-color", "#7C6EF8").attr("stop-opacity", 0.25);
    linearGradient.append("stop").attr("offset", "100%").attr("stop-color", "#7C6EF8").attr("stop-opacity", 0.0);

    g.append("path").datum(trendData).attr("fill", `url(#${gradientId})`).attr("d", area);
    g.append("path").datum(trendData).attr("fill", "none").attr("stroke", "#7C6EF8").attr("stroke-width", 2).attr("d", line);

    g.selectAll(".dot")
      .data(trendData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.month) || 0)
      .attr("cy", (d) => y(d.value))
      .attr("r", 3.5)
      .attr("fill", "#0D0D10")
      .attr("stroke", "#7C6EF8")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => setHoveredTrend(d))
      .on("mouseleave", () => setHoveredTrend(null));
  }, [dimensions, trendData, p.id]);

  if (isLoading && marketOutput.length < 100) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Activity className="w-8 h-8 text-[#7C6EF8] animate-pulse" />
        <p className="text-sm text-zinc-400 font-mono">Market Analyst is compiling your study...</p>
        {marketOutput.length > 0 && (
          <p className="text-xs text-zinc-600 font-mono max-w-lg text-center">{marketOutput.slice(0, 200)}...</p>
        )}
      </div>
    );
  }

  const validationBadge =
    content.validationScore >= 90 ? { text: "VERY HIGH FIT", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15" } :
    content.validationScore >= 75 ? { text: "HIGH FIT", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15" } :
    content.validationScore >= 60 ? { text: "MODERATE FIT", color: "text-amber-400 bg-amber-500/10 border-amber-500/15" } :
    { text: "EARLY STAGE", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/15" };

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>

      {/* 2-Column Top Section: Validation Score Gauge & D3 Trend Line Chart */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">

        {/* Validation Score Gauge Card */}
        <div className="md:col-span-5 p-5 bg-[#0D0D10] border border-white/5 rounded-xl flex flex-col justify-between shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#7C6EF8]" />
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[#7C6EF8]">
                Problem Validation
              </h3>
            </div>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${validationBadge.color}`}>
              {validationBadge.text}
            </span>
          </div>

          <div className="flex items-center gap-6 my-4 py-2">
            {/* SVG Ring Gauge */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="url(#gauge-grad)"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - content.validationScore / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7C6EF8" />
                    <stop offset="100%" stopColor="#9F95FF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-bold font-space text-white">{content.validationScore}%</span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Score</span>
              </div>
            </div>

            {/* Score Breakdown factors */}
            <div className="flex-1 flex flex-col gap-2">
              {content.validationFactors.map((factor, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-400 font-sans">{factor.name}</span>
                    <span className="text-zinc-200 font-mono font-medium">{factor.score}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7C6EF8] to-[#9F95FF] rounded-full transition-all duration-1000"
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans border-t border-white/5 pt-3">
            {content.validationFeedback}
          </p>
        </div>

        {/* D3 Search Trend Curve Card */}
        <div className="md:col-span-7 p-5 bg-[#0D0D10] border border-white/5 rounded-xl flex flex-col justify-between shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#7C6EF8]" />
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[#7C6EF8]">
                Market Interest Trend
              </h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[140px]">
              {content.keyword || p.idea?.slice(0, 30)}
            </span>
          </div>

          <div className="relative flex-1 min-h-[140px] flex items-center justify-center mt-3">
            <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="overflow-visible select-none" />

            {/* Float Tooltip */}
            <div className="absolute top-2 right-2 w-32 bg-zinc-950/90 border border-white/5 rounded-md p-1.5 shadow-xl backdrop-blur-sm pointer-events-none transition-all duration-200 min-h-[42px] flex flex-col justify-center items-center">
              {hoveredTrend ? (
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-mono text-[#7C6EF8] uppercase tracking-wider">{hoveredTrend.month} 2025</span>
                  <span className="text-xs font-bold text-white mt-0.5">Interest: {hoveredTrend.value}/100</span>
                </div>
              ) : (
                <span className="text-[9px] text-zinc-600 font-mono uppercase text-center">Hover nodes</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Target Audience Persona Card Deck */}
      <div className="p-5 bg-[#0D0D10] border border-white/5 rounded-xl shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#7C6EF8]" />
            <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[#7C6EF8]">
              Target Audience Breakdown
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 uppercase">Ideal User Archetype</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-zinc-950/50 border border-white/5 rounded-lg">
            <span className="text-[10px] font-mono text-[#7C6EF8] uppercase tracking-widest font-semibold">Demographics</span>
            <div className="flex flex-col gap-2 mt-3">
              <div className="flex justify-between text-xs border-b border-white/5 pb-1.5">
                <span className="text-zinc-500">Target Role</span>
                <span className="text-zinc-200 font-medium text-right line-clamp-1 max-w-[60%]">{content.demographics.roles}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-white/5 pb-1.5">
                <span className="text-zinc-500">Average Age</span>
                <span className="text-zinc-200 font-medium">{content.demographics.age}</span>
              </div>
              <div className="flex justify-between text-xs pb-0.5">
                <span className="text-zinc-500">Earnings Estimate</span>
                <span className="text-zinc-200 font-medium">{content.demographics.salary}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-zinc-950/50 border border-white/5 rounded-lg flex flex-col gap-3">
            <div>
              <span className="text-[10px] font-mono text-[#7C6EF8] uppercase tracking-widest font-semibold">Psychographics & Motivations</span>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                <strong>Core Motivation:</strong> {content.psychographics.motives}
              </p>
            </div>
            {content.psychographics.habits && (
              <div className="border-t border-white/5 pt-2.5">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <strong>Adoption Habits:</strong> {content.psychographics.habits}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Competitor Deep-dive Table */}
      {content.competitors.length > 0 && (
        <div className="p-5 bg-[#0D0D10] border border-white/5 rounded-xl shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#7C6EF8]" />
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[#7C6EF8]">
                Asymmetric Competitor Deep-Dive
              </h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Market Gap Analysis</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  <th className="pb-3 pr-4 font-semibold">Competitor</th>
                  <th className="pb-3 px-4 font-semibold">Est. Funding</th>
                  <th className="pb-3 px-4 font-semibold">Est. Users</th>
                  <th className="pb-3 px-4 font-semibold">Core Strength</th>
                  <th className="pb-3 pl-4 font-semibold">Moat Gap / Weakness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {content.competitors.map((comp, idx) => (
                  <tr key={idx} className="text-xs group hover:bg-white/[0.01] transition-colors">
                    <td className="py-3.5 pr-4 font-semibold font-display text-white">{comp.name}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">{comp.funding}</td>
                    <td className="py-3.5 px-4 font-mono text-[#7C6EF8]">{comp.users}</td>
                    <td className="py-3.5 px-4 text-zinc-400 font-sans leading-normal">{comp.strength}</td>
                    <td className="py-3.5 pl-4 text-zinc-300 font-sans leading-normal flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500/80 mt-0.5 shrink-0" />
                      <span>{comp.weakness}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Market Signals */}
      {content.signals.length > 0 && (
        <div className="p-5 bg-[#0D0D10] border border-white/5 rounded-xl shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#7C6EF8]" />
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[#7C6EF8]">
                Key Market Signals
              </h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Industry Catalysts</span>
          </div>

          <div className="flex flex-col gap-3">
            {content.signals.map((signal, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 bg-zinc-950/50 border border-white/5 rounded-lg hover:border-[#7C6EF8]/20 transition-all duration-200"
              >
                <ArrowUpRight className="w-4 h-4 text-[#7C6EF8] mt-0.5 shrink-0" />
                <p className="text-xs text-zinc-300 leading-relaxed">{signal}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw markdown fallback if parsing found little data */}
      {content.competitors.length === 0 && content.signals.length === 0 && marketOutput.length > 200 && (
        <div className="p-5 bg-[#0D0D10] border border-white/5 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
            <BarChart2 className="w-4 h-4 text-[#7C6EF8]" />
            <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[#7C6EF8]">Full Market Analysis</h3>
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap">
            {marketOutput}
          </div>
        </div>
      )}
    </div>
  );
}
