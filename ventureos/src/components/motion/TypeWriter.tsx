import { useEffect, useState, useRef } from "react";

interface TypeWriterProps {
  text: string;
  speed?: number; // milliseconds per character
  isStreaming?: boolean; // if true, it just shows text with cursor without artificial delay
}

export default function TypeWriter({
  text,
  speed = 12,
  isStreaming = false,
}: TypeWriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    if (isStreaming) {
      setDisplayedText(text);
      return;
    }

    // If not streaming, do a typewriter effect over the whole text
    let currentIdx = 0;
    setDisplayedText("");
    
    const interval = setInterval(() => {
      if (currentIdx < textRef.current.length) {
        setDisplayedText((prev) => prev + textRef.current.charAt(currentIdx));
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, isStreaming]);

  return (
    <div className="relative inline">
      <span>{displayedText}</span>
      {(isStreaming || displayedText.length < text.length) && (
        <span className="terminal-cursor" />
      )}
    </div>
  );
}
