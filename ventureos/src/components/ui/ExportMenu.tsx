import { useState, useRef, useEffect } from "react";
import { Download, FileText, Share2, Clipboard, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ExportMenuProps {
  onExport: (type: "pdf" | "notion" | "link") => void;
}

export default function ExportMenu({ onExport }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (type: "pdf" | "notion" | "link") => {
    onExport(type);
    setIsOpen(false);
    
    // Show toast feedback
    const labels = { pdf: "PDF generated successfully", notion: "Exported to Notion workspace", link: "Venture link copied to clipboard" };
    setFeedback(labels[type]);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3.5 py-1.75 bg-zinc-950 border border-white/5 rounded-lg text-xs font-semibold tracking-tight font-display text-zinc-300 hover:text-white hover:border-[#7C6EF8]/40 hover:bg-zinc-900/60 transition-all duration-200"
      >
        <Download className="w-3.5 h-3.5 text-[#7C6EF8]" />
        <span>EXPORT PACKAGE</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-52 bg-zinc-950/95 border border-white/5 rounded-xl shadow-2xl backdrop-blur-md z-50 p-1.5"
          >
            <div className="px-2 py-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1.5">
              Available Formats
            </div>

            <button
              onClick={() => handleSelect("pdf")}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-zinc-400" />
              <span>Compile to PDF Report</span>
            </button>

            <button
              onClick={() => handleSelect("notion")}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
            >
              <Share2 className="w-4 h-4 text-zinc-400" />
              <span>Sync to Notion Workspace</span>
            </button>

            <button
              onClick={() => handleSelect("link")}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
            >
              <Clipboard className="w-4 h-4 text-zinc-400" />
              <span>Copy Venture Hub Link</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-fidelity toast feedback popover */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 bg-zinc-900/90 border border-[#7C6EF8]/30 rounded-xl shadow-[0_0_20px_rgba(124,110,248,0.1)] backdrop-blur-md z-50"
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#7C6EF8]/10 text-[#7C6EF8]">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs text-zinc-200 font-display font-medium">
              {feedback}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
