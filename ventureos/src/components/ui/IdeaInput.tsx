import { useState, useEffect, useRef } from "react";
import { ArrowRight, Sparkles, Loader2, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface IdeaInputProps {
  onSubmit: (idea: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  size?: "large" | "medium";
}

const EXAMPLE_CHIPS = [
  "Smart attendance system using facial recognition",
  "AI-powered hyper-personalized tutoring app",
  "Ultra-fast local neighborhood delivery tracker"
];

export default function IdeaInput({
  onSubmit,
  isLoading = false,
  placeholder = "Describe your raw venture or product idea...",
  size = "large",
}: IdeaInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeChipIdx, setActiveChipIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auto-cycle example chips every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveChipIdx((prev) => (prev + 1) % EXAMPLE_CHIPS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSubmit(inputValue.trim());
    }
  };

  const handleChipClick = (chipText: string) => {
    setInputValue(chipText);
  };

  // Toggle voice-to-text recording
  const toggleRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Safari.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputValue(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsRecording(false);
    }
  };

  // Ensure recording is stopped if component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const isLarge = size === "large";

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative w-full">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading-bar"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex items-center justify-between w-full p-4 md:p-5 bg-zinc-900/60 border border-[#7C6EF8]/30 rounded-xl shadow-[0_0_20px_rgba(124,110,248,0.15)] backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[#7C6EF8] animate-spin" />
                <span className="text-sm font-medium text-zinc-300 font-display tracking-tight">
                  Analyzing raw concept & orchestrating 5 expert agents...
                </span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">EST: 60s</span>
            </motion.div>
          ) : (
            <motion.div
              key="input-bar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`group relative flex items-center bg-zinc-950 border border-white/5 rounded-xl transition-all duration-300 ${
                isLarge ? "p-2.5 md:p-3" : "p-1.5 md:p-2"
              } ${isRecording ? "border-[#FF5A5A]/50 shadow-[0_0_25px_rgba(255,90,90,0.15)]" : "focus-within:border-[#7C6EF8]/40 focus-within:shadow-[0_0_25px_rgba(124,110,248,0.12)]"}`}
            >
              <div className="flex items-center pl-2 text-zinc-500 group-focus-within:text-[#7C6EF8] transition-colors duration-200">
                {isRecording ? (
                  <span className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A5A] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF5A5A]"></span>
                  </span>
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isRecording ? "Listening... speak clearly" : placeholder}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-500 select-none"
              />

              {/* Voice Trigger Mic button inside the input group */}
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isLoading}
                title={isRecording ? "Stop voice input" : "Start voice to text input"}
                className={`mr-2 p-2 rounded-lg transition-all duration-200 ${
                  isRecording 
                    ? "bg-[#FF5A5A]/20 text-[#FF5A5A] hover:bg-[#FF5A5A]/30" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`flex items-center justify-center rounded-lg bg-[#7C6EF8] text-white hover:bg-[#6c5ee0] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 ${
                  isLarge ? "p-2.5 md:px-5 md:py-2.5 gap-2" : "p-2 md:px-4 md:py-2 gap-1.5"
                }`}
              >
                {isLarge && (
                  <span className="hidden md:inline text-xs font-semibold tracking-wide font-display">
                    COMPILE
                  </span>
                )}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Helper Suggestion Chips */}
      {!isLoading && (
        <div className="mt-4 flex flex-col items-center">
          <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider mb-2">
            Suggested Incubation Concepts
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
            {EXAMPLE_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`px-3 py-1.5 text-xs text-zinc-400 bg-zinc-900/40 border border-white/5 rounded-full hover:border-[#7C6EF8]/30 hover:text-[#7C6EF8] transition-all duration-300 ${
                  activeChipIdx === idx
                    ? "border-zinc-700 text-zinc-300 bg-zinc-900/80"
                    : ""
                }`}
              >
                {chip.length > 32 ? chip.slice(0, 32) + "..." : chip} →
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
