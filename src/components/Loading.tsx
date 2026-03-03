import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

const steps = [
  "Connecting to URL...",
  "Fetching HTML Content...",
  "Parsing DOM Structure...",
  "Extracting Metadata & Schema...",
  "Analyzing Semantic Density...",
  "Evaluating E-E-A-T Signals...",
  "Calculating AEO Score...",
  "Generating Recommendations...",
];

export default function Loading() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-6">
      <div className="relative w-20 h-20">
        <motion.span
          className="absolute top-0 left-0 w-full h-full border-4 border-google-blue/20 rounded-full"
        />
        <motion.span
          className="absolute top-0 left-0 w-full h-full border-4 border-t-google-blue border-r-google-red border-b-google-yellow border-l-google-green rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        />
      </div>
      <div className="text-center space-y-2">
        <motion.h3
          key={stepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-lg font-medium text-foreground bg-clip-text text-transparent bg-gradient-to-r from-google-blue to-google-red"
        >
          {steps[stepIndex]}
        </motion.h3>
        <p className="text-sm text-muted-foreground">
          This may take up to 30 seconds due to deep AI analysis.
        </p>
      </div>
    </div>
  );
}
