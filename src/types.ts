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
    priority: "High" | "Medium" | "Low";
    impact: "High" | "Medium" | "Low";
    action: string;
    reason: string;
  }>;
  keywords: Array<{
    term: string;
    reason: string;
  }>;
}
