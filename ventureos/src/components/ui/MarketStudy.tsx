import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Project } from "../../types";
import { 
  TrendingUp, 
  Users, 
  Target, 
  ShieldAlert, 
  Newspaper, 
  Flame, 
  ArrowUpRight, 
  Award,
  DollarSign
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

interface NewsHeadline {
  title: string;
  source: string;
  time: string;
  url: string;
}

export default function MarketStudy({ project }: MarketStudyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 200 });
  const [hoveredTrend, setHoveredTrend] = useState<{ month: string; value: number } | null>(null);

  // 1. Analyze domain and idea keywords for content tailoring
  const getDomainAndTailoredContent = () => {
    const idea = project.idea.toLowerCase();
    
    if (
      idea.includes("school") || 
      idea.includes("attendance") || 
      idea.includes("education") || 
      idea.includes("student") || 
      idea.includes("learn")
    ) {
      return {
        keyword: "Classroom AI Automation",
        validationScore: 88,
        validationFeedback: "Extremely high frequency problem. Teachers spend up to 4.5 hours weekly on administrative routines. High friction but education budgets are historically slow to close contracts.",
        validationFactors: [
          { name: "Pain Intensity", score: 92 },
          { name: "Usage Frequency", score: 95 },
          { name: "Budget Availability", score: 72 },
          { name: "Willingness to Pay", score: 85 }
        ],
        demographics: {
          age: "25 - 55 years old",
          salary: "$45k - $85k",
          roles: "K-12 Teachers, School Principals, EdTech Administrators",
        },
        psychographics: {
          motives: "Reclaiming instructional time, reducing burnout, auditing student safety.",
          habits: "Adopts tools recommended by peers, heavy usage of Google Classroom, highly protective of classroom focus.",
        },
        competitors: [
          { name: "Blackboard", funding: "$2.1B Valuation", users: "150M+ Users", strength: "Deep enterprise contracts", weakness: "Clunky UI, slow load times, massive legacy licensing overhead" },
          { name: "Quizlet", funding: "$62M Series C", users: "50M+ Users", strength: "Highly gamified flashcards", weakness: "Pure study aid, lacks school administrative tracking or automated workflows" },
          { name: "Duolingo", funding: "$180M IPO", users: "24M+ DAU", strength: "Elite visual mechanics", weakness: "Consumers only, zero customizability for school boards" }
        ],
        news: [
          { title: "EdTech Capital Pivots Toward Specialized Low-Code Admin Tools", source: "TechCrunch", time: "2 days ago", url: "#" },
          { title: "K-12 School Boards Allocate 12% More to AI Classroom Assistants in 2026", source: "EdWeek", time: "1 week ago", url: "#" },
          { title: "Teacher Administrative Burnout Reaches Historical High, Prompting Urgent Low-Cost Tool Adoption", source: "VentureBeat", time: "3 weeks ago", url: "#" }
        ],
        trendBase: [50, 48, 55, 62, 60, 68, 70, 78, 85, 82, 88, 95]
      };
    } else if (
      idea.includes("finance") || 
      idea.includes("payment") || 
      idea.includes("bank") || 
      idea.includes("invoice") || 
      idea.includes("freelancer") || 
      idea.includes("billing")
    ) {
      return {
        keyword: "Freelance Micro-invoicing",
        validationScore: 94,
        validationFeedback: "Direct tie to revenue generation creates a massive willingness to pay. Main challenge is that user churn in early-stage freelancing is historically high.",
        validationFactors: [
          { name: "Pain Intensity", score: 96 },
          { name: "Usage Frequency", score: 88 },
          { name: "Budget Availability", score: 90 },
          { name: "Willingness to Pay", score: 98 }
        ],
        demographics: {
          age: "21 - 40 years old",
          salary: "$60k - $140k",
          roles: "Contract Developers, Independent Designers, Solo Operators",
        },
        psychographics: {
          motives: "Accelerating cash flow velocity, minimizing tax math overhead, appearing highly professional.",
          habits: "Prefers minimalist, single-purpose apps, adopts payment links over complex contracts, uses direct Slack messaging.",
        },
        competitors: [
          { name: "Stripe Invoicing", funding: "$9.5B+ Raised", users: "3M+ Merchants", strength: "Unrivaled API infrastructure", weakness: "Complex developer portal, steep pricing for small invoice batches" },
          { name: "HoneyBook", funding: "$250M Series D", users: "100k+ Active", strength: "Full client CRM portal", weakness: "Too complex, expensive ($39/mo base) for simple freelancers who just want instant payments" },
          { name: "Wise Business", funding: "$450M IPO", users: "16M+ Accounts", strength: "Exceptional FX rates", weakness: "Focused on global cash transfers, no local client project management capabilities" }
        ],
        news: [
          { title: "Freelance Economy Value Crosses $1.6 Trillion, Reshaping Invoicing Standards", source: "Wall Street Journal", time: "1 day ago", url: "#" },
          { title: "Real-Time Freelance Tax Reporting Becomes Mandatory in 4 European Hubs", source: "Bloomberg", time: "5 days ago", url: "#" },
          { title: "Usage-Based Billing Outperforms Flat SaaS Rates for Solo Builders", source: "Fintech Insider", time: "2 weeks ago", url: "#" }
        ],
        trendBase: [40, 42, 48, 52, 58, 60, 65, 72, 70, 78, 86, 92]
      };
    } else {
      // Default Tech / AI / SaaS content
      return {
        keyword: "Autonomous Agent Orchestration",
        validationScore: 86,
        validationFeedback: "Strong technical pain point with high excitement in the market. The core hurdle is building a defensible moat as large language model capabilities continue to commoditize.",
        validationFactors: [
          { name: "Pain Intensity", score: 88 },
          { name: "Usage Frequency", score: 85 },
          { name: "Budget Availability", score: 84 },
          { name: "Willingness to Pay", score: 86 }
        ],
        demographics: {
          age: "24 - 45 years old",
          salary: "$90k - $180k",
          roles: "Product Managers, Software Engineers, Operations Managers",
        },
        psychographics: {
          motives: "Eliminating manual data-sync tasks, scaling system output without hiring, developer-first controls.",
          habits: "Builds workflows on weekends, active on GitHub/Reddit, rapid adopter of open-source tooling.",
        },
        competitors: [
          { name: "Zapier", funding: "$1.3B Valuation", users: "4M+ Accounts", strength: "6,000+ API integrations", weakness: "Static linear workflows, no self-healing AI agents or contextual logic" },
          { name: "Retool", funding: "$127M Raised", users: "500k+ Devs", strength: "Exceptional UI canvas building", weakness: "Requires manual coding, long setup cycle, expensive seat-based pricing" },
          { name: "Custom Consultancies", funding: "Bootstrapped", users: "Thousands", strength: "Hyper-tailored manual work", weakness: "Takes months, expensive ($50k-$150k contracts), highly rigid codebases" }
        ],
        news: [
          { title: "Enterprise Budgets for AI Agentic Workflows Expected to Surge 40% Next Quarter", source: "Gartner", time: "3 hours ago", url: "#" },
          { title: "New Security Benchmarks Established for Autonomous Workspace Orchestrators", source: "Wired", time: "3 days ago", url: "#" },
          { title: "Why Seed Investors Are Passing on Wrapper Apps and Funding Agentic Canvas Platforms", source: "PitchBook", time: "1 week ago", url: "#" }
        ],
        trendBase: [30, 35, 38, 48, 52, 60, 68, 75, 82, 80, 88, 96]
      };
    }
  };

  const content = getDomainAndTailoredContent();

  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const trendData = months.map((m, i) => ({
    month: m,
    value: content.trendBase[i]
  }));

  // Handle D3 Chart sizing and resize events
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 300),
        height: 200
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // D3 Chart Rendering logic
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 25, bottom: 25, left: 35 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X Scale
    const x = d3.scalePoint()
      .domain(months)
      .range([0, chartWidth]);

    // Y Scale
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    // Axes
    const xAxis = d3.axisBottom(x).tickSize(0).tickPadding(8);
    const yAxis = d3.axisLeft(y).ticks(4).tickSize(-chartWidth).tickPadding(8);

    // Draw Y grid lines
    g.append("g")
      .attr("class", "y-grid")
      .call(yAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "rgba(255, 255, 255, 0.03)"))
      .call(g => g.selectAll(".tick text").attr("fill", "rgba(255, 255, 255, 0.3)").attr("font-size", "9px").attr("font-family", "var(--font-mono)"));

    // Draw X Axis
    g.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(xAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text").attr("fill", "rgba(255, 255, 255, 0.3)").attr("font-size", "9px").attr("font-family", "var(--font-mono)"));

    // Line generator with smooth curve
    const line = d3.line<{ month: string; value: number }>()
      .x(d => x(d.month) || 0)
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Area generator for gradient fill underneath the line
    const area = d3.area<{ month: string; value: number }>()
      .x(d => x(d.month) || 0)
      .y0(chartHeight)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Add Area Gradient
    const gradientId = `area-gradient-${project.id}`;
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    linearGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#7C6EF8")
      .attr("stop-opacity", 0.25);

    linearGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#7C6EF8")
      .attr("stop-opacity", 0.0);

    // Draw area path
    g.append("path")
      .datum(trendData)
      .attr("fill", `url(#${gradientId})`)
      .attr("d", area);

    // Draw line path
    g.append("path")
      .datum(trendData)
      .attr("fill", "none")
      .attr("stroke", "#7C6EF8")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Dots & Interactive overlays
    g.selectAll(".dot")
      .data(trendData)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.month) || 0)
      .attr("cy", d => y(d.value))
      .attr("r", 3.5)
      .attr("fill", "#0D0D10")
      .attr("stroke", "#7C6EF8")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => setHoveredTrend(d))
      .on("mouseleave", () => setHoveredTrend(null));

  }, [dimensions, trendData, project.id]);

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>
      
      {/* 2-Column Top Section: Validation Score Gauge & D3 Trend Line Chart */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Validation Score Gauge Card (5 cols) */}
        <div className="md:col-span-5 p-5 bg-[#0D0D10] border border-white/5 rounded-xl flex flex-col justify-between shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#7C6EF8]" />
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[#7C6EF8]">
                Problem Validation
              </h3>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">
              HIGH FIT
            </span>
          </div>

          <div className="flex items-center gap-6 my-4 py-2">
            {/* SVG Ring Gauge */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.02)"
                  strokeWidth="8"
                />
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
                <span className="text-xl font-bold font-space text-white">
                  {content.validationScore}%
                </span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                  Score
                </span>
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
                      className="h-full bg-gradient-to-right from-[#7C6EF8] to-[#9F95FF] rounded-full transition-all duration-1000"
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

        {/* D3 Search Trend Curve Card (7 cols) */}
        <div className="md:col-span-7 p-5 bg-[#0D0D10] border border-white/5 rounded-xl flex flex-col justify-between shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#7C6EF8]" />
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[#7C6EF8]">
                Search Interest Trend (Google Trends Style)
              </h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500">
              KW: "{content.keyword}"
            </span>
          </div>

          <div className="relative flex-1 min-h-[140px] flex items-center justify-center mt-3">
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="overflow-visible select-none"
            />

            {/* Float Tooltip */}
            <div className="absolute top-2 right-2 w-32 bg-zinc-950/90 border border-white/5 rounded-md p-1.5 shadow-xl backdrop-blur-sm pointer-events-none transition-all duration-200 min-h-[42px] flex flex-col justify-center items-center">
              {hoveredTrend ? (
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-mono text-[#7C6EF8] uppercase tracking-wider">{hoveredTrend.month} 2026</span>
                  <span className="text-xs font-bold text-white mt-0.5">Interest: {hoveredTrend.value}/100</span>
                </div>
              ) : (
                <span className="text-[9px] text-zinc-600 font-mono uppercase text-center">
                  Hover nodes
                </span>
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
          <span className="text-[9px] font-mono text-zinc-500 uppercase">
            Ideal User Archetype
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-zinc-950/50 border border-white/5 rounded-lg">
            <span className="text-[10px] font-mono text-[#7C6EF8] uppercase tracking-widest font-semibold">Demographics</span>
            <div className="flex flex-col gap-2 mt-3">
              <div className="flex justify-between text-xs border-b border-white/5 pb-1.5">
                <span className="text-zinc-500">Target Role</span>
                <span className="text-zinc-200 font-medium text-right line-clamp-1">{content.demographics.roles}</span>
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
            <div className="border-t border-white/5 pt-2.5">
              <p className="text-xs text-zinc-400 leading-relaxed">
                <strong>Adoption Habits:</strong> {content.psychographics.habits}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Competitor Deep-dive Table */}
      <div className="p-5 bg-[#0D0D10] border border-white/5 rounded-xl shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#7C6EF8]" />
            <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[#7C6EF8]">
              Asymmetric Competitor Deep-Dive
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 uppercase">
            Market Gap Analysis
          </span>
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

      {/* Industry News Headlines */}
      <div className="p-5 bg-[#0D0D10] border border-white/5 rounded-xl shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[#7C6EF8]" />
            <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[#7C6EF8]">
              Industry News & Sector Signals
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 uppercase">
            Market Signals
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {content.news.map((item, idx) => (
            <a 
              key={idx} 
              href={item.url}
              onClick={(e) => e.preventDefault()} 
              className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-white/5 rounded-lg hover:border-[#7C6EF8]/30 hover:bg-zinc-950 transition-all duration-200 group"
            >
              <div className="flex flex-col gap-1 pr-6">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors leading-relaxed">
                  {item.title}
                </span>
                <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500">
                  <span className="text-zinc-400">{item.source}</span>
                  <span>•</span>
                  <span>{item.time}</span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-[#7C6EF8] group-hover:border-[#7C6EF8]/20 transition-all duration-200 shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
