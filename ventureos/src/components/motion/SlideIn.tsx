import { motion } from "motion/react";
import { ReactNode } from "react";

interface SlideInProps {
  children: ReactNode;
  direction?: "left" | "right" | "top" | "bottom";
  delay?: number;
  duration?: number;
  className?: string;
}

export default function SlideIn({
  children,
  direction = "left",
  delay = 0,
  duration = 0.4,
  className = "",
}: SlideInProps) {
  const getInitial = () => {
    switch (direction) {
      case "left":
        return { x: -30, opacity: 0 };
      case "right":
        return { x: 30, opacity: 0 };
      case "top":
        return { y: -30, opacity: 0 };
      case "bottom":
        return { y: 30, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={getInitial()}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
