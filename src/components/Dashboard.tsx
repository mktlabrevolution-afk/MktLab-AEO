import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { AnalysisResult } from "@/src/types";
import { Button } from "@/src/components/ui/button";
import { Download, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { motion } from "motion/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DashboardProps {
  result: AnalysisResult;
  url: string;
}

export default function Dashboard({ result, url }: DashboardProps) {
  const criteriaData = [
    { subject: "Contenido", A: result.criteriaScores.content, fullMark: 100 },
    { subject: "Schema", A: result.criteriaScores.structuredData, fullMark: 100 },
    { subject: "E-E-A-T", A: result.criteriaScores.eeat, fullMark: 100 },
    { subject: "UX", A: result.criteriaScores.ux, fullMark: 100 },
    { subject: "Intención", A: result.criteriaScores.intent, fullMark: 100 },
    { subject: "Metadatos", A: result.criteriaScores.metadata, fullMark: 100 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Brand Colors
    const brandNavy = "#0B162C";
    const brandGreen = "#00D06C";
    const brandLight = "#F8FAFC";

    // --- Header ---
    // Background for header
    doc.setFillColor(brandNavy);
    doc.rect(0, 0, 210, 40, "F");

    // Logo Text: R'Evolution
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("R'Evolution", 14, 20);
    
    // Subtitle: Education Group
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("EDUCATION GROUP", 14, 26);

    // Report Title (Right aligned in header)
    doc.setFontSize(16);
    doc.setTextColor(brandGreen);
    doc.text("REPORTE DE ANÁLISIS AEO", 196, 22, { align: "right" });

    // --- Info Section ---
    doc.setTextColor(brandNavy);
    doc.setFontSize(10);
    doc.text(`URL Analizada: ${url}`, 14, 50);
    doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString()}`, 14, 56);

    // --- Overall Score Circle ---
    // Draw circle
    doc.setDrawColor(brandGreen);
    doc.setLineWidth(2);
    doc.circle(170, 60, 12);
    
    // Score text inside circle
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandNavy);
    doc.text(`${result.overallScore}`, 170, 62, { align: "center" });
    
    // Label below circle
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Puntuación General", 170, 78, { align: "center" });

    // --- Executive Summary ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandNavy);
    doc.text("Resumen Ejecutivo", 14, 70);
    
    // Green accent line
    doc.setDrawColor(brandGreen);
    doc.setLineWidth(1);
    doc.line(14, 73, 60, 73);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const splitSummary = doc.splitTextToSize(result.summary, 130);
    doc.text(splitSummary, 14, 80);

    // --- Criteria Breakdown Table ---
    let yPos = 110;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandNavy);
    doc.text("Desglose de Criterios", 14, yPos);
    
    // Green accent line
    doc.setDrawColor(brandGreen);
    doc.setLineWidth(1);
    doc.line(14, yPos + 3, 65, yPos + 3);
    
    yPos += 10;
    
    const criteriaRows = [
      ["Contenido Semántico", result.criteriaScores.content],
      ["Datos Estructurados", result.criteriaScores.structuredData],
      ["E-E-A-T", result.criteriaScores.eeat],
      ["UX y Core Web Vitals", result.criteriaScores.ux],
      ["Intención de Búsqueda", result.criteriaScores.intent],
      ["Metadatos", result.criteriaScores.metadata],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [["Criterio", "Puntuación"]],
      body: criteriaRows,
      theme: 'grid',
      headStyles: { fillColor: brandNavy, textColor: brandGreen, fontStyle: 'bold' },
      styles: { textColor: brandNavy, fontSize: 10 },
      alternateRowStyles: { fillColor: brandLight },
    });

    // --- Recommendations Table ---
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 20;
    
    // Check for page break
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandNavy);
    doc.text("Recomendaciones Priorizadas", 14, yPos);
    
    // Green accent line
    doc.setDrawColor(brandGreen);
    doc.setLineWidth(1);
    doc.line(14, yPos + 3, 85, yPos + 3);

    yPos += 10;

    const recRows = result.recommendations.map(r => [r.priority, r.action, r.reason]);
    autoTable(doc, {
      startY: yPos,
      head: [["Prioridad", "Acción", "Razón"]],
      body: recRows,
      theme: 'grid',
      headStyles: { fillColor: brandNavy, textColor: brandGreen, fontStyle: 'bold' },
      styles: { textColor: brandNavy, fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 25 }, // Priority column
      },
      alternateRowStyles: { fillColor: brandLight },
    });

    // --- Keywords Table ---
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 20;

    // Check for page break
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandNavy);
    doc.text("Palabras Clave de Activación IA", 14, yPos);
    
    // Green accent line
    doc.setDrawColor(brandGreen);
    doc.setLineWidth(1);
    doc.line(14, yPos + 3, 90, yPos + 3);

    yPos += 10;

    const kwRows = result.keywords.map(k => [k.term, k.reason]);
    autoTable(doc, {
      startY: yPos,
      head: [["Palabra Clave", "Relevancia IA"]],
      body: kwRows,
      theme: 'grid',
      headStyles: { fillColor: brandNavy, textColor: brandGreen, fontStyle: 'bold' },
      styles: { textColor: brandNavy, fontSize: 10 },
      alternateRowStyles: { fillColor: brandLight },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount} - Generado por AEO R'Evolution Group`, 105, 290, { align: "center" });
    }

    doc.save("aeo-reporte-revolution.pdf");
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-brand-navy">Resultados del Análisis</h2>
          <p className="text-brand-navy/60 text-sm font-mono mt-1">{url}</p>
        </div>
        <Button onClick={generatePDF} className="gap-2 bg-brand-navy hover:bg-brand-navy/90 text-white border-0 shadow-md">
          <Download className="w-4 h-4" />
          Descargar Reporte
        </Button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center brand-border"
        >
          <h3 className="text-sm font-medium text-brand-navy/60 uppercase tracking-wider mb-2">Puntuación General AEO</h3>
          <div className="relative flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-brand-navy/10"
              />
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={377}
                strokeDashoffset={377 - (377 * result.overallScore) / 100}
                className={getScoreColor(result.overallScore)}
              />
            </svg>
            <span className={`absolute text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
              {result.overallScore}
            </span>
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 glass-card rounded-2xl p-6 flex flex-col justify-center brand-border"
        >
          <h3 className="text-sm font-medium text-brand-navy/60 uppercase tracking-wider mb-3">Resumen Ejecutivo</h3>
          <p className="text-lg leading-relaxed text-brand-navy/90">{result.summary}</p>
        </motion.div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 min-h-[400px] brand-border"
        >
          <h3 className="text-sm font-medium text-brand-navy/60 uppercase tracking-wider mb-6">Radar de Rendimiento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={criteriaData}>
              <PolarGrid stroke="#0B162C" strokeOpacity={0.1} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#0B162C', fontSize: 12, opacity: 0.7 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Puntuación"
                dataKey="A"
                stroke="#0B162C"
                fill="#0B162C"
                fillOpacity={0.2}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'rgba(11, 22, 44, 0.1)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#0B162C' }}
                itemStyle={{ color: '#0B162C' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6 brand-border"
        >
          <h3 className="text-sm font-medium text-brand-navy/60 uppercase tracking-wider mb-6">Desglose de Criterios</h3>
          <div className="space-y-4">
            {criteriaData.map((item, index) => (
              <div key={item.subject} className="flex items-center gap-4">
                <span className="w-32 text-sm font-medium text-brand-navy">{item.subject}</span>
                <div className="flex-1 h-2 bg-brand-navy/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.A}%` }}
                    transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                    className={`h-full rounded-full ${getScoreBg(item.A)} shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                  />
                </div>
                <span className={`w-8 text-sm font-bold text-right ${getScoreColor(item.A)}`}>{item.A}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recommendations & Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card rounded-2xl p-6 brand-border"
        >
          <h3 className="text-sm font-medium text-brand-navy/60 uppercase tracking-wider mb-6">Recomendaciones Priorizadas</h3>
          <div className="space-y-4">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/40 border border-white/40 hover:bg-white/60 transition-colors">
                <div className="mt-1">
                  {rec.priority === "Alta" ? (
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  ) : rec.priority === "Media" ? (
                    <Info className="w-5 h-5 text-amber-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                      rec.priority === "Alta" ? "bg-rose-100 text-rose-700" :
                      rec.priority === "Media" ? "bg-amber-100 text-amber-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      Prioridad {rec.priority}
                    </span>
                    <span className="text-xs text-brand-navy/60">Impacto: {rec.impact}</span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1 text-brand-navy">{rec.action}</h4>
                  <p className="text-sm text-brand-navy/70">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-6 brand-border"
        >
          <h3 className="text-sm font-medium text-brand-navy/60 uppercase tracking-wider mb-6">Palabras Clave de Activación IA</h3>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((kw, i) => (
              <div key={i} className="group relative">
                <span className="inline-block px-3 py-1.5 bg-brand-navy/5 text-brand-navy rounded-full text-sm font-medium cursor-help border border-brand-navy/10 hover:bg-brand-navy hover:text-white transition-all shadow-sm">
                  {kw.term}
                </span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-white/90 backdrop-blur-md text-brand-navy text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-white/50">
                  {kw.reason}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
