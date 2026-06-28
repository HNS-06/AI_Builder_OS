import React, { useState, useEffect } from "react";
import { Project } from "../../types";
import { 
  Sparkles, 
  Download, 
  Palette, 
  RefreshCw, 
  Type, 
  Check, 
  FileImage,
  Layers
} from "lucide-react";

interface AIBrandingSuiteProps {
  project: Project;
}

export default function AIBrandingSuite({ project }: AIBrandingSuiteProps) {
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeColorPalette, setActiveColorPalette] = useState<"violet" | "teal" | "amber" | "rose">("violet");
  const [brandFont, setBrandFont] = useState<"Space Grotesk" | "Syne" | "Inter">("Space Grotesk");
  const [isCopied, setIsCopied] = useState(false);

  const ideaName = project.idea
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "Startup Core";

  const fetchLogo = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate-logo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea: project.idea,
          name: ideaName,
        }),
      });
      const data = await response.json();
      if (data.imageUrl) {
        setLogoUrl(data.imageUrl);
      }
    } catch (err) {
      console.error("Failed to fetch brand logo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogo();
  }, [project.id]);

  const handleCopyColor = (colorHex: string) => {
    navigator.clipboard.writeText(colorHex);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  // Derive colors based on selected palette theme
  const getPaletteColors = () => {
    switch (activeColorPalette) {
      case "violet":
        return [
          { name: "Primary Accent", hex: "#7C6EF8", tailwind: "bg-[#7C6EF8]" },
          { name: "Deep Ink", hex: "#12121A", tailwind: "bg-[#12121A]" },
          { name: "Muted Lavender", hex: "#E9E3FF", tailwind: "bg-[#E9E3FF]" },
          { name: "Slate Border", hex: "#2C2B3E", tailwind: "bg-[#2C2B3E]" },
        ];
      case "teal":
        return [
          { name: "Primary Accent", hex: "#0D9488", tailwind: "bg-[#0D9488]" },
          { name: "Deep Forest Ink", hex: "#0B1515", tailwind: "bg-[#0B1515]" },
          { name: "Muted Teal", hex: "#CCFBF1", tailwind: "bg-[#CCFBF1]" },
          { name: "Teal Slate Border", hex: "#1F2D2D", tailwind: "bg-[#1F2D2D]" },
        ];
      case "amber":
        return [
          { name: "Primary Accent", hex: "#D97706", tailwind: "bg-[#D97706]" },
          { name: "Deep Amber Ink", hex: "#17120B", tailwind: "bg-[#17120B]" },
          { name: "Muted Gold", hex: "#FEF3C7", tailwind: "bg-[#FEF3C7]" },
          { name: "Gold Slate Border", hex: "#352A18", tailwind: "bg-[#352A18]" },
        ];
      case "rose":
        return [
          { name: "Primary Accent", hex: "#E11D48", tailwind: "bg-[#E11D48]" },
          { name: "Deep Rose Ink", hex: "#1A0E13", tailwind: "bg-[#1A0E13]" },
          { name: "Muted Cherry", hex: "#FFE4E6", tailwind: "bg-[#FFE4E6]" },
          { name: "Rose Slate Border", hex: "#3D1E29", tailwind: "bg-[#3D1E29]" },
        ];
    }
  };

  const colors = getPaletteColors();

  return (
    <div className="flex flex-col gap-6 w-full text-zinc-300">
      
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/30 p-4 border border-white/5 rounded-xl">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 font-display">
            AI Branding Identity Suite
          </h3>
          <p className="text-xs text-zinc-500 font-mono uppercase mt-0.5 tracking-wider">
            Synthesized vectors, palettes, and brand typography
          </p>
        </div>
        
        <button
          onClick={fetchLogo}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 border border-white/10 hover:border-[#7C6EF8]/30 rounded-lg text-zinc-300 hover:text-[#7C6EF8] transition-all shrink-0 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Re-generate Logo</span>
        </button>
      </div>

      {/* Main Grid: Logo Preview & Palette Control */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Card: Logo Preview */}
        <div className="md:col-span-5 p-5 bg-zinc-900/20 border border-white/5 rounded-xl flex flex-col items-center justify-center text-center gap-4 relative">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest absolute top-4 left-4">
            AESTHETIC MARK ICON
          </span>

          <div className="w-40 h-40 bg-zinc-950 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative group">
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 rounded-full border border-zinc-700 border-t-[#7C6EF8] animate-spin" />
                <span className="text-[10px] text-zinc-500 font-mono">Synthesizing...</span>
              </div>
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt={`${ideaName} Logo`}
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-zinc-600 font-mono text-[10px]">Empty Canvas</div>
            )}
          </div>

          <div className="flex flex-col items-center gap-1">
            <h4 className="text-sm font-bold text-zinc-200 font-display">{ideaName}</h4>
            <p className="text-xs text-zinc-500 font-mono">Brand Identity Mockup</p>
          </div>
        </div>

        {/* Right Card: Palette, Typo & Guide */}
        <div className="md:col-span-7 flex flex-col gap-6">
          
          {/* Section A: Brand Palette Selection */}
          <div className="p-5 bg-zinc-900/20 border border-white/5 rounded-xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#7C6EF8]" /> Start-up Color Palette
              </span>
              
              {/* Palette Switchers */}
              <div className="flex gap-1.5 bg-zinc-950 p-1 border border-white/5 rounded-lg">
                {(["violet", "teal", "amber", "rose"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setActiveColorPalette(p)}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      p === "violet" ? "bg-[#7C6EF8]" : p === "teal" ? "bg-teal-600" : p === "amber" ? "bg-amber-600" : "bg-rose-600"
                    } ${
                      activeColorPalette === p ? "border-white scale-110 shadow-md" : "border-transparent hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Colors Grid Display */}
            <div className="grid grid-cols-2 gap-3 mt-1">
              {colors.map((color, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCopyColor(color.hex)}
                  className="p-3 bg-zinc-950 border border-white/5 rounded-lg flex items-center gap-3 hover:border-white/10 transition-all cursor-pointer group"
                >
                  <div className={`w-8 h-8 rounded-md ${color.tailwind} shrink-0 shadow-sm`} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-zinc-300 truncate">{color.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold mt-0.5 group-hover:text-[#7C6EF8] transition-all">
                      {isCopied ? "copied" : color.hex}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Brand Fonts Selection */}
          <div className="p-5 bg-zinc-900/20 border border-white/5 rounded-xl flex flex-col gap-4">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-[#7C6EF8]" /> Typography Pairing Selection
            </span>

            <div className="grid grid-cols-3 gap-2">
              {(["Space Grotesk", "Syne", "Inter"] as const).map((font) => (
                <button
                  key={font}
                  onClick={() => setBrandFont(font)}
                  className={`px-3 py-2 text-xs font-semibold tracking-tight rounded-lg border transition-all ${
                    brandFont === font
                      ? "bg-[#7C6EF8]/10 border-[#7C6EF8] text-white"
                      : "bg-zinc-950 border-white/5 text-zinc-400 hover:text-zinc-200"
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>

            {/* Typography Preview card */}
            <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block mb-2">Typography Live Render</span>
              <h2 className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: brandFont }}>
                Accelerating the future of decentralized enterprise workflows.
              </h2>
              <p className="text-xs text-zinc-500 mt-2 font-mono">
                Pairing: {brandFont} Display / Inter Regular UI font body
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
