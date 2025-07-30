'use client';

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BoxesProps {
  className?: string;
}

const BoxCell = ({ i, j }: { i: number; j: number }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={() => setIsHovered(true)}
      animate={{
        backgroundColor: isHovered 
          ? "hsl(var(--primary) / 0.4)" 
          : "hsl(var(--primary) / 0)",
      }}
      transition={{
        duration: isHovered ? 0 : 0.8,
        ease: "easeOut"
      }}
      className="w-16 h-8 border-r border-t border-border/20 relative"
    >
      {j % 2 === 0 && i % 2 === 0 ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="absolute h-6 w-10 -top-[14px] -left-[22px] text-border/30 stroke-[1px] pointer-events-none"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m6-6H6"
          />
        </svg>
      ) : null}
    </motion.div>
  );
};

export const Boxes = ({ className, ...rest }: BoxesProps) => {
  const rows = new Array(150).fill(1);
  const cols = new Array(100).fill(1);

  return (
    <div
      style={{
        transform: `translate(-40%,-60%) skewX(-48deg) skewY(14deg) scale(0.675) rotate(0deg) translateZ(0)`,
      }}
      className={cn(
        "absolute left-1/4 p-4 -top-1/4 flex -translate-x-1/2 -translate-y-1/2 w-full h-full z-0",
        className
      )}
      {...rest}
    >
      {rows.map((_, i) => (
        <motion.div
          key={`row` + i}
          className="w-16 h-8 border-l border-border/20 relative"
        >
          {cols.map((_, j) => (
            <BoxCell key={`col` + j} i={i} j={j} />
          ))}
        </motion.div>
      ))}
    </div>
  );
};