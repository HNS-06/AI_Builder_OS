import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Project } from "../../types";
import { 
  TrendingUp, 
  Maximize, 
  Cpu, 
  Coins, 
  Users as UsersIcon,
  Sparkles,
  Info,
  ChevronRight
} from "lucide-react";

interface D3RadarChartProps {
  project: Project;
}

interface RadarDimension {
  key: string;
  label: string;
  score: number;
  description: string;
  color: string;
  icon: React.ComponentType<any>;
}

export default function D3RadarChart({ project }: D3RadarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 420, height: 320 });
  const [activeDimension, setActiveDimension] = useState<string | null>(null);

  // Parse real scores from Market Analyst agent output
  const marketOutput = project.agents.find((a) => a.name === "Market Analyst")?.output || "";
  const founderOutput = project.agents.find((a) => a.name === "Venture Planner")?.output || "";
  const combinedOutput = marketOutput + "\n" + founderOutput;

  const parseScore = (text: string, keywords: string[], defaultMin: number, defaultMax: number): number => {
    const lines = text.split("\n");
    for (const keyword of keywords) {
      const line = lines.find((l) => l.toLowerCase().includes(keyword.toLowerCase()));
      if (line) {
        const match = line.match(/(\d{1,3})\s*\/\s*100/);
        if (match) return Math.min(100, Math.max(1, parseInt(match[1])));
        const pctMatch = line.match(/(\d{1,3})%/);
        if (pctMatch) return Math.min(100, Math.max(1, parseInt(pctMatch[1])));
      }
    }
    // Fallback: derive from text signals
    const positiveSignals = ["strong", "high", "excellent", "significant", "large", "growing", "massive"].filter((s) =>
      combinedOutput.toLowerCase().includes(s)
    ).length;
    const base = defaultMin + Math.round(((defaultMax - defaultMin) * positiveSignals) / 7);
    return Math.min(defaultMax, Math.max(defaultMin, base));
  };

  const radarData: RadarDimension[] = [
    {
      key: "market",
      label: "Market Potential",
      score: parseScore(combinedOutput, ["pain intensity", "market potential", "total addressable"], 68, 94),
      description: "Addressable market depth, urgency of buyer pain points, and competitive asymmetry.",
      color: "#7C6EF8",
      icon: TrendingUp
    },
    {
      key: "scalability",
      label: "Scalability",
      score: parseScore(combinedOutput, ["scalab", "usage frequency", "growth"], 65, 92),
      description: "Operating leverage, ease of distribution, and potential to expand into adjacent categories.",
      color: "#10B981",
      icon: Maximize
    },
    {
      key: "technical",
      label: "Technical Feasibility",
      score: parseScore(combinedOutput, ["technical", "budget availability", "tech stack"], 70, 94),
      description: "Execution complexity, timeline risk, availability of standard API wedges, and moat creation.",
      color: "#3B82F6",
      icon: Cpu
    },
    {
      key: "funding",
      label: "Funding Readiness",
      score: parseScore(combinedOutput, ["funding", "willingness to pay", "revenue model", "investor"], 65, 92),
      description: "Investor thesis alignment, clear path to seed triggers, and attractive unit economics margin.",
      color: "#F59E0B",
      icon: Coins
    },
    {
      key: "team",
      label: "Overall Viability",
      score: parseScore(combinedOutput, ["overall validation", "overall score", "viability"], 70, 96),
      description: "Combined assessment of market timing, execution feasibility, and competitive positioning.",
      color: "#EC4899",
      icon: UsersIcon
    }
  ];

  const averageScore = Math.round(radarData.reduce((acc, curr) => acc + curr.score, 0) / radarData.length);

  // Map out rating tier and grade based on average score
  const getRatingInfo = (score: number) => {
    if (score >= 90) return { grade: "A+", label: "Venture Elite" };
    if (score >= 85) return { grade: "A", label: "Strong Seed Candidate" };
    if (score >= 80) return { grade: "A-", label: "High Traction Incubator" };
    if (score >= 75) return { grade: "B+", label: "Viable Launch Prototype" };
    return { grade: "B", label: "Exploratory Phase" };
  };

  const ratingInfo = getRatingInfo(averageScore);


  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Allow flexible grid alignment
      setDimensions({
        width: Math.max(width, 280),
        height: 320
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // D3 Rendering
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous drawing

    const { width, height } = dimensions;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const radius = Math.min(chartWidth, chartHeight) / 2;
    const cx = width / 2;
    const cy = height / 2;

    const numAxes = radarData.length;
    const angleSlice = (Math.PI * 2) / numAxes;

    // Outer group
    const mainGroup = svg.append("g");

    // Radial axis angles (subtracting PI / 2 to point top-axis straight up)
    const getAngle = (i: number) => i * angleSlice - Math.PI / 2;

    // --- 1. Draw concentric background webs (Grid lines) ---
    const levels = 5;
    const gridData = Array.from({ length: levels }, (_, i) => (i + 1) / levels);

    gridData.forEach((level) => {
      const levelRadius = radius * level;
      const points: [number, number][] = [];

      for (let i = 0; i < numAxes; i++) {
        const angle = getAngle(i);
        points.push([
          cx + levelRadius * Math.cos(angle),
          cy + levelRadius * Math.sin(angle)
        ]);
      }

      // Append polygon ring
      mainGroup.append("polygon")
        .attr("points", points.map(p => p.join(",")).join(" "))
        .attr("fill", "none")
        .attr("stroke", "rgba(255, 255, 255, 0.05)")
        .attr("stroke-width", 1);

      // Append level labels along the vertical top axis
      const verticalAngle = getAngle(0);
      mainGroup.append("text")
        .attr("x", cx + 6)
        .attr("y", cy + levelRadius * Math.sin(verticalAngle) + 4)
        .attr("fill", "rgba(255, 255, 255, 0.15)")
        .attr("font-size", "8px")
        .attr("font-family", "var(--font-mono)")
        .text(`${Math.round(level * 100)}`);
    });

    // --- 2. Draw axis lines ---
    for (let i = 0; i < numAxes; i++) {
      const angle = getAngle(i);
      const outerX = cx + radius * Math.cos(angle);
      const outerY = cy + radius * Math.sin(angle);

      mainGroup.append("line")
        .attr("x1", cx)
        .attr("y1", cy)
        .attr("x2", outerX)
        .attr("y2", outerY)
        .attr("stroke", "rgba(255, 255, 255, 0.08)")
        .attr("stroke-width", 1.2);
    }

    // --- 3. Draw Axis Labels ---
    const labelDistanceFactor = 1.15;
    radarData.forEach((dim, i) => {
      const angle = getAngle(i);
      const labelX = cx + radius * labelDistanceFactor * Math.cos(angle);
      // Extra offset to keep labels aligned cleanly
      let labelY = cy + radius * labelDistanceFactor * Math.sin(angle);
      
      // Adjust alignments
      let textAnchor = "middle";
      if (Math.cos(angle) > 0.1) textAnchor = "start";
      else if (Math.cos(angle) < -0.1) textAnchor = "end";

      if (i === 0) labelY -= 5; // top label padding
      if (i === 1 || i === 4) labelY += 2; // mid/low labels spacing

      mainGroup.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("fill", activeDimension === dim.key ? "#7C6EF8" : "#A1A1AA")
        .attr("font-size", "9px")
        .attr("font-weight", activeDimension === dim.key ? "bold" : "medium")
        .attr("font-family", "var(--font-mono)")
        .attr("text-anchor", textAnchor)
        .text(dim.label.toUpperCase())
        .style("cursor", "pointer")
        .on("mouseenter", () => setActiveDimension(dim.key))
        .on("mouseleave", () => setActiveDimension(null));
    });

    // --- 4. Draw Score Web (The active radar shape) ---
    const scorePoints: [number, number][] = radarData.map((dim, i) => {
      const angle = getAngle(i);
      const valRadius = radius * (dim.score / 100);
      return [
        cx + valRadius * Math.cos(angle),
        cy + valRadius * Math.sin(angle)
      ];
    });

    // Color gradient for the polygon
    const defs = svg.append("defs");
    const radialGrad = defs.append("radialGradient")
      .attr("id", "radar-gradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");
    
    radialGrad.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#7C6EF8")
      .attr("stop-opacity", 0.05);
    radialGrad.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#5C4EF0")
      .attr("stop-opacity", 0.35);

    // Score Polygon path
    mainGroup.append("polygon")
      .attr("points", scorePoints.map(p => p.join(",")).join(" "))
      .attr("fill", "url(#radar-gradient)")
      .attr("stroke", "#7C6EF8")
      .attr("stroke-width", 2.5)
      .attr("filter", "url(#glow-filter)");

    // Glowing filter definition
    const filter = defs.append("filter")
      .attr("id", "glow-filter")
      .attr("x", "-30%")
      .attr("y", "-30%")
      .attr("width", "160%")
      .attr("height", "160%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "blur");
    
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // --- 5. Interactive Vertex Dots ---
    radarData.forEach((dim, i) => {
      const angle = getAngle(i);
      const valRadius = radius * (dim.score / 100);
      const dotX = cx + valRadius * Math.cos(angle);
      const dotY = cy + valRadius * Math.sin(angle);

      const isCurrentActive = activeDimension === dim.key;

      // Interaction zone (larger invisible circle for hover comfort)
      const interactCircle = mainGroup.append("circle")
        .attr("cx", dotX)
        .attr("cy", dotY)
        .attr("r", 15)
        .attr("fill", "transparent")
        .style("cursor", "pointer");

      // Solid visible point
      const visibleCircle = mainGroup.append("circle")
        .attr("cx", dotX)
        .attr("cy", dotY)
        .attr("r", isCurrentActive ? 6 : 4)
        .attr("fill", isCurrentActive ? "#FFF" : "#7C6EF8")
        .attr("stroke", "#0D0D10")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .style("transition", "all 0.15s ease-out");

      const handleEnter = () => {
        setActiveDimension(dim.key);
        visibleCircle.attr("r", 7).attr("fill", "#FFF");
      };

      const handleLeave = () => {
        setActiveDimension(null);
        visibleCircle.attr("r", 4).attr("fill", "#7C6EF8");
      };

      interactCircle
        .on("mouseenter", handleEnter)
        .on("mouseleave", handleLeave);
      visibleCircle
        .on("mouseenter", handleEnter)
        .on("mouseleave", handleLeave);
    });

  }, [dimensions, activeDimension]);

  return (
    <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 flex flex-col gap-6 w-full text-zinc-300">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-white/5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 font-display flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#7C6EF8]" />
            Venture Incubation Milestones
          </h3>
          <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mt-0.5">
            Holistic capability mapping index across five critical axes
          </p>
        </div>

        {/* Global score indicator */}
        <div className="flex items-center gap-3 bg-zinc-950 p-2 border border-white/5 rounded-xl shrink-0">
          <div className="w-10 h-10 rounded-lg bg-[#7C6EF8]/10 border border-[#7C6EF8]/20 flex items-center justify-center text-[#7C6EF8] font-mono font-bold text-lg">
            {ratingInfo.grade}
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">Incubation Index</div>
            <div className="text-xs font-bold text-zinc-200 mt-0.5">{averageScore}% Score · {ratingInfo.label}</div>
          </div>
        </div>
      </div>

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left column: SVG Canvas */}
        <div 
          ref={containerRef} 
          className="lg:col-span-6 flex items-center justify-center relative min-h-[320px] bg-zinc-950/20 border border-white/[0.03] rounded-xl overflow-hidden"
        >
          {/* Subtle geometric grid backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,110,248,0.03)_0%,transparent_70%)] pointer-events-none" />
          
          <svg 
            ref={svgRef} 
            width={dimensions.width} 
            height={dimensions.height}
            className="overflow-visible select-none"
          />

          {/* Central tooltip overlay for axis values */}
          {activeDimension && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-950/90 border border-[#7C6EF8]/40 px-3 py-1.5 rounded-lg text-center shadow-xl animate-fade-in pointer-events-none">
              {radarData.map(dim => {
                if (dim.key === activeDimension) {
                  return (
                    <div key={dim.key} className="flex flex-col">
                      <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider font-bold">{dim.label}</span>
                      <span className="text-xs font-bold text-white font-mono mt-0.5">{dim.score}/100 Score</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        {/* Right column: Interactive Breakdown items */}
        <div className="lg:col-span-6 flex flex-col gap-2.5">
          {radarData.map((dim) => {
            const IconComponent = dim.icon;
            const isHighlighted = activeDimension === dim.key;

            return (
              <div
                key={dim.key}
                onMouseEnter={() => setActiveDimension(dim.key)}
                onMouseLeave={() => setActiveDimension(null)}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                  isHighlighted 
                    ? "bg-[#7C6EF8]/5 border-[#7C6EF8]/40 shadow-md translate-x-1" 
                    : "bg-zinc-950/60 border-white/5 hover:border-white/10"
                }`}
              >
                {/* Horizontal progress accent line along top */}
                <div 
                  className="absolute top-0 left-0 h-[2px] transition-all duration-300" 
                  style={{ 
                    width: `${dim.score}%`, 
                    backgroundColor: isHighlighted ? "#7C6EF8" : "rgba(255,255,255,0.08)" 
                  }}
                />

                <div className="flex gap-3 items-start">
                  {/* Aspect Icon */}
                  <div className={`p-2 rounded-lg border transition-all ${
                    isHighlighted 
                      ? "bg-[#7C6EF8]/10 border-[#7C6EF8]/30 text-[#7C6EF8]" 
                      : "bg-zinc-900 border-white/5 text-zinc-500 group-hover:text-zinc-300"
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold font-sans ${isHighlighted ? "text-white" : "text-zinc-300"}`}>
                        {dim.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-400 group-hover:text-[#7C6EF8] transition-all">
                        {dim.score}/100
                      </span>
                    </div>
                    
                    <p className={`text-[11px] leading-relaxed mt-1 font-sans ${isHighlighted ? "text-zinc-300" : "text-zinc-500"}`}>
                      {dim.description}
                    </p>
                  </div>

                  <ChevronRight className={`w-3.5 h-3.5 text-zinc-600 transition-all self-center shrink-0 ${
                    isHighlighted ? "translate-x-1 text-[#7C6EF8]" : "group-hover:text-zinc-400"
                  }`} />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
