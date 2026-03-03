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
    { subject: "Content", A: result.criteriaScores.content, fullMark: 100 },
    { subject: "Schema", A: result.criteriaScores.structuredData, fullMark: 100 },
    { subject: "E-E-A-T", A: result.criteriaScores.eeat, fullMark: 100 },
    { subject: "UX", A: result.criteriaScores.ux, fullMark: 100 },
    { subject: "Intent", A: result.criteriaScores.intent, fullMark: 100 },
    { subject: "Metadata", A: result.criteriaScores.metadata, fullMark: 100 },
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
    
    // Title
    doc.setFontSize(20);
    doc.text("AEO Analysis Report", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`URL: ${url}`, 14, 32);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);

    // Overall Score
    doc.setFontSize(16);
    doc.text(`Overall AEO Score: ${result.overallScore}/100`, 14, 50);

    // Summary
    doc.setFontSize(14);
    doc.text("Executive Summary", 14, 65);
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(result.summary, 180);
    doc.text(splitSummary, 14, 72);

    // Criteria Scores
    let yPos = 90;
    doc.setFontSize(14);
    doc.text("Criteria Breakdown", 14, yPos);
    yPos += 10;
    
    const criteriaRows = [
      ["Semantic Content", result.criteriaScores.content],
      ["Structured Data", result.criteriaScores.structuredData],
      ["E-E-A-T", result.criteriaScores.eeat],
      ["UX & Core Web Vitals", result.criteriaScores.ux],
      ["Search Intent", result.criteriaScores.intent],
      ["Metadata", result.criteriaScores.metadata],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [["Criteria", "Score"]],
      body: criteriaRows,
    });

    // Recommendations
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Prioritized Recommendations", 14, yPos);
    yPos += 5;

    const recRows = result.recommendations.map(r => [r.priority, r.action, r.reason]);
    autoTable(doc, {
      startY: yPos,
      head: [["Priority", "Action", "Reason"]],
      body: recRows,
    });

    // Keywords
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("AI Activation Keywords", 14, yPos);
    yPos += 5;

    const kwRows = result.keywords.map(k => [k.term, k.reason]);
    autoTable(doc, {
      startY: yPos,
      head: [["Keyword", "AI Relevance"]],
      body: kwRows,
    });

    doc.save("aeo-report.pdf");
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analysis Results</h2>
          <p className="text-muted-foreground text-sm font-mono mt-1">{url}</p>
        </div>
        <Button onClick={generatePDF} className="gap-2">
          <Download className="w-4 h-4" />
          Download Report
        </Button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center rainbow-border"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Overall AEO Score</h3>
          <div className="relative flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted/20"
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
          className="md:col-span-2 glass-card rounded-2xl p-6 flex flex-col justify-center rainbow-border"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Executive Summary</h3>
          <p className="text-lg leading-relaxed text-foreground/90">{result.summary}</p>
        </motion.div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 min-h-[400px] rainbow-border"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">Performance Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={criteriaData}>
              <PolarGrid stroke="currentColor" className="text-muted/20" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-muted-foreground" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Score"
                dataKey="A"
                stroke="#4285F4"
                fill="#4285F4"
                fillOpacity={0.4}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.5)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6 rainbow-border"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">Criteria Breakdown</h3>
          <div className="space-y-4">
            {criteriaData.map((item, index) => (
              <div key={item.subject} className="flex items-center gap-4">
                <span className="w-32 text-sm font-medium">{item.subject}</span>
                <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
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
          className="lg:col-span-2 glass-card rounded-2xl p-6 rainbow-border"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">Prioritized Recommendations</h3>
          <div className="space-y-4">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/40 border border-white/40 hover:bg-white/60 transition-colors">
                <div className="mt-1">
                  {rec.priority === "High" ? (
                    <AlertTriangle className="w-5 h-5 text-google-red" />
                  ) : rec.priority === "Medium" ? (
                    <Info className="w-5 h-5 text-google-yellow" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-google-green" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                      rec.priority === "High" ? "bg-red-100 text-red-700" :
                      rec.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {rec.priority} Priority
                    </span>
                    <span className="text-xs text-muted-foreground">Impact: {rec.impact}</span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{rec.action}</h4>
                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-6 rainbow-border"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">AI Activation Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((kw, i) => (
              <div key={i} className="group relative">
                <span className="inline-block px-3 py-1.5 bg-white/50 text-google-blue rounded-full text-sm font-medium cursor-help border border-google-blue/20 hover:bg-google-blue hover:text-white transition-all shadow-sm">
                  {kw.term}
                </span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-white/90 backdrop-blur-md text-foreground text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-white/50">
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
