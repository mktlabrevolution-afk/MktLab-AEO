import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

const steps = [
  "Conectando a la URL...",
  "Obteniendo Contenido HTML...",
  "Analizando Estructura DOM...",
  "Extrayendo Metadatos y Schema...",
  "Analizando Densidad Semántica...",
  "Evaluando Señales E-E-A-T...",
  "Calculando Puntuación AEO...",
  "Generando Recomendaciones...",
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
          className="absolute top-0 left-0 w-full h-full border-4 border-brand-navy/10 rounded-full"
        />
        <motion.span
          className="absolute top-0 left-0 w-full h-full border-4 border-t-brand-navy border-r-brand-green border-b-brand-navy border-l-brand-green rounded-full"
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
          className="text-lg font-medium text-brand-navy"
        >
          {steps[stepIndex]}
        </motion.h3>
        <p className="text-sm text-brand-navy/60">
          Esto puede tomar hasta 30 segundos debido al análisis profundo de IA.
        </p>
      </div>
    </div>
  );
}
