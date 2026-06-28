import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Project } from "../../types";

interface D3MarketChartProps {
  project: Project;
}

interface MarketDataPoint {
  name: string;
  label: string;
  value: number; // in Millions USD
  originalText: string;
  color: string;
  description: string;
}

export default function D3MarketChart({ project }: D3MarketChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 320 });
  const [hoveredData, setHoveredData] = useState<MarketDataPoint | null>(null);

  // Helper to parse TAM, SAM, SOM from markdown text
  const parseMarketData = (): MarketDataPoint[] => {
    const marketOutput = project.agents.find(a => a.name === "Market Analyst")?.output || "";
    
    // Default values if parsing fails
    let tamValue = 48500; // $48.5 Billion
    let samValue = 12400; // $12.4 Billion
    let somValue = 320;   // $320 Million

    let tamText = "$48.5 Billion";
    let samText = "$12.4 Billion";
    let somText = "$320 Million";

    // Regex to search for Billion or Million values
    // Look for lines containing TAM, SAM, SOM
    const lines = marketOutput.split("\n");
    lines.forEach(line => {
      const lower = line.toLowerCase();
      
      // Parse numbers out of lines like "* **Total Addressable Market (TAM)**: $48.5 Billion..."
      const matchNum = line.match(/\$?([0-9]+(?:\.[0-9]+)?)\s*(Billion|Million|B|M)/i);
      if (matchNum) {
        const num = parseFloat(matchNum[1]);
        const unit = matchNum[2].toLowerCase();
        const valueInM = unit.startsWith("b") ? num * 1000 : num;
        const formattedText = unit.startsWith("b") ? `$${num} Billion` : `$${num} Million`;

        if (lower.includes("tam") || lower.includes("total addressable")) {
          tamValue = valueInM;
          tamText = formattedText;
        } else if (lower.includes("sam") || lower.includes("serviceable addressable")) {
          samValue = valueInM;
          samText = formattedText;
        } else if (lower.includes("som") || lower.includes("serviceable obtainable") || lower.includes("som")) {
          somValue = valueInM;
          somText = formattedText;
        }
      }
    });

    // Make sure values are mathematically nested SOM < SAM < TAM
    if (somValue >= samValue) {
      somValue = samValue * 0.1;
      somText = `$${(somValue / 1000).toFixed(1)} Billion`;
    }
    if (samValue >= tamValue) {
      samValue = tamValue * 0.25;
      samText = `$${(samValue / 1000).toFixed(1)} Billion`;
    }

    return [
      {
        name: "TAM",
        label: "Total Addressable Market",
        value: tamValue,
        originalText: tamText,
        color: "#3B2E99", // Deep subtle violet
        description: "Entire global demand for this startup's product category."
      },
      {
        name: "SAM",
        label: "Serviceable Addressable Market",
        value: samValue,
        originalText: samText,
        color: "#5C4EF0", // Core branding violet
        description: "The specific segment of the TAM targetable by your current technology and channel."
      },
      {
        name: "SOM",
        label: "Serviceable Obtainable Market",
        value: somValue,
        originalText: somText,
        color: "#9F95FF", // Vibrant light indigo accent
        description: "Your realistic target market share in the next 2-3 years."
      }
    ];
  };

  const data = parseMarketData();

  // Resize listener
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Maintain premium aspect ratio
      setDimensions({
        width: Math.max(width, 300),
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
    svg.selectAll("*").remove(); // Clean canvas

    const { width, height } = dimensions;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // --- LEFT HALF: Nested Concentric Rectangles (Market Overlap Concept) ---
    // This emphasizes that SOM belongs in SAM, which belongs in TAM.
    const nestedWidth = Math.min(chartWidth * 0.45, chartHeight); 
    const nestedHeight = nestedWidth;
    const nestedX = margin.left;
    const nestedY = margin.top + (chartHeight - nestedHeight) / 2;

    const nestedGroup = svg.append("g")
      .attr("transform", `translate(${nestedX}, ${nestedY})`);

    // We can draw 3 nested boxes centered or aligned to the bottom-left
    // Draw TAM (outermost box)
    const tamSize = nestedWidth;
    // Scale SAM and SOM proportionately to square root of values to represent area accurately
    const tamValue = data[0].value;
    const samRatio = Math.sqrt(data[1].value / tamValue);
    const somRatio = Math.sqrt(data[2].value / tamValue);

    const samSize = tamSize * samRatio;
    const somSize = tamSize * somRatio;

    // TAM Outer Box
    nestedGroup.append("rect")
      .attr("x", 0)
      .attr("y", nestedHeight - tamSize)
      .attr("width", tamSize)
      .attr("height", tamSize)
      .attr("rx", 12)
      .attr("fill", data[0].color)
      .attr("fill-opacity", 0.15)
      .attr("stroke", data[0].color)
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseenter", () => setHoveredData(data[0]))
      .on("mouseleave", () => setHoveredData(null));

    // SAM Box (nested bottom-left)
    nestedGroup.append("rect")
      .attr("x", 0)
      .attr("y", nestedHeight - samSize)
      .attr("width", samSize)
      .attr("height", samSize)
      .attr("rx", 8)
      .attr("fill", data[1].color)
      .attr("fill-opacity", 0.35)
      .attr("stroke", data[1].color)
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseenter", () => setHoveredData(data[1]))
      .on("mouseleave", () => setHoveredData(null));

    // SOM Box (nested bottom-left)
    nestedGroup.append("rect")
      .attr("x", 0)
      .attr("y", nestedHeight - somSize)
      .attr("width", somSize)
      .attr("height", somSize)
      .attr("rx", 6)
      .attr("fill", data[2].color)
      .attr("fill-opacity", 0.7)
      .attr("stroke", data[2].color)
      .attr("stroke-dasharray", "2,2")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseenter", () => setHoveredData(data[2]))
      .on("mouseleave", () => setHoveredData(null));

    // Add nested labels
    nestedGroup.append("text")
      .attr("x", 8)
      .attr("y", nestedHeight - tamSize + 20)
      .attr("fill", "#A1A1AA")
      .attr("font-size", "10px")
      .attr("font-family", "var(--font-mono)")
      .text("TAM");

    nestedGroup.append("text")
      .attr("x", 8)
      .attr("y", nestedHeight - samSize + 20)
      .attr("fill", "#E4E4E7")
      .attr("font-size", "10px")
      .attr("font-family", "var(--font-mono)")
      .text("SAM");

    // --- RIGHT HALF: Styled High-End Comparison Bar Chart ---
    const barX = margin.left + nestedWidth + 40;
    const barWidth = Math.max(chartWidth - nestedWidth - 40, 100);

    const barGroup = svg.append("g")
      .attr("transform", `translate(${barX}, ${margin.top})`);

    // Setup logarithmic scale for market comparison since TAM and SOM are orders of magnitude apart
    const yScale = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, chartHeight])
      .padding(0.35);

    // X scale is linear but we can make it highly readable
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 1])
      .range([0, barWidth]);

    // Draw bars with premium styling, borders, and glows
    const bars = barGroup.selectAll(".bar-rect")
      .data(data)
      .enter()
      .append("g")
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => setHoveredData(d))
      .on("mouseleave", () => setHoveredData(null));

    // Bar background tracks
    bars.append("rect")
      .attr("x", 0)
      .attr("y", d => yScale(d.name) || 0)
      .attr("width", barWidth)
      .attr("height", yScale.bandwidth())
      .attr("rx", 6)
      .attr("fill", "rgba(255, 255, 255, 0.02)")
      .attr("stroke", "rgba(255, 255, 255, 0.04)")
      .attr("stroke-width", 1);

    // Active fill bars
    bars.append("rect")
      .attr("class", "bar-rect")
      .attr("x", 0)
      .attr("y", d => yScale(d.name) || 0)
      .attr("width", 0) // animate from 0
      .attr("height", yScale.bandwidth())
      .attr("rx", 6)
      .attr("fill", d => d.color)
      .attr("fill-opacity", 0.85)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr("width", d => xScale(d.value));

    // Labels on top or inside bars
    bars.append("text")
      .attr("x", 12)
      .attr("y", d => (yScale(d.name) || 0) + yScale.bandwidth() / 2 + 4)
      .attr("fill", "#F2F2F0")
      .attr("font-size", "11px")
      .attr("font-family", "var(--font-sans)")
      .attr("font-weight", "600")
      .text(d => `${d.name} (${d.originalText})`);

    // Display sub-percentage relative to TAM
    bars.append("text")
      .attr("x", d => Math.max(xScale(d.value) - 45, 12))
      .attr("y", d => (yScale(d.name) || 0) + yScale.bandwidth() / 2 + 4)
      .attr("fill", "rgba(255, 255, 255, 0.5)")
      .attr("font-size", "9px")
      .attr("font-family", "var(--font-mono)")
      .attr("text-anchor", "start")
      .text(d => {
        if (d.name === "TAM") return "100%";
        const percentage = (d.value / data[0].value) * 100;
        return percentage < 1 ? `${percentage.toFixed(2)}%` : `${percentage.toFixed(1)}%`;
      });

  }, [dimensions, data]);

  return (
    <div className="flex flex-col gap-5 p-5 bg-[#0D0D0D] border border-white/5 rounded-xl shadow-lg relative overflow-hidden" ref={containerRef}>
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-[#7C6EF8]">
            Interactive TAM / SAM / SOM Modeler
          </h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            D3 visual scale mapping. Hover segments to analyze market shares.
          </p>
        </div>
        <span className="text-[10px] font-mono text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded border border-white/5">
          D3.js ENGINE
        </span>
      </div>

      <div className="relative flex-1 min-h-[320px] flex items-center justify-center">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible select-none"
        />

        {/* Floating details overlay on hover */}
        <div className="absolute right-4 bottom-4 w-60 bg-zinc-950/95 border border-white/10 rounded-lg p-3 shadow-2xl backdrop-blur-md transition-all duration-200 pointer-events-none min-h-[90px]">
          {hoveredData ? (
            <div className="flex flex-col gap-1 animate-fade-in-up">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredData.color }} />
                <span className="text-xs font-semibold font-display tracking-tight text-white uppercase">
                  {hoveredData.label}
                </span>
              </div>
              <div className="text-sm font-bold font-space text-[#7C6EF8] mt-1">
                {hoveredData.originalText}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 leading-normal font-sans">
                {hoveredData.description}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full pt-4">
              <p className="text-[11px] text-zinc-600 font-mono">
                HOVER CHARTS TO VIEW METRICS
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
