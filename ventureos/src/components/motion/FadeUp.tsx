import { motion } from "motion/react";
import { ReactNode } from "react";

interface FadeUpProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export default function FadeUp({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
}: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // premium custom cubic bezier easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
