export interface AnalysisResult {
  overallScore: number;
  criteriaScores: {
    content: number;
    structuredData: number;
    eeat: number;
    ux: number;
    intent: number;
    metadata: number;
  };
  summary: string;
  recommendations: Array<{
    priority: "Alta" | "Media" | "Baja";
    impact: "Alto" | "Medio" | "Bajo";
    action: string;
    reason: string;
  }>;
  keywords: Array<{
    term: string;
    reason: string;
  }>;
}
