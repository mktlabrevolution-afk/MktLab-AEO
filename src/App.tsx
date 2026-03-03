import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { Search, Sparkles, LayoutDashboard, FileText, Key, Save } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import Dashboard from "@/src/components/Dashboard";
import Loading from "@/src/components/Loading";
import { AnalysisResult } from "@/src/types";

export default function App() {
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [savedApiKey, setSavedApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSaveApiKey = () => {
    setSavedApiKey(apiKey);
    setShowApiKeyInput(false);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post("/api/analyze", { 
        url,
        apiKey: savedApiKey // Send the saved API key
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to analyze URL. Please check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-primary/20">
      {/* Navbar */}
      <header className="border-b border-white/20 bg-white/40 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-google-blue to-google-green rounded-lg flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-google-blue via-google-red to-google-yellow">
              AEO R'Evolution Group
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/50 transition-all rounded-full"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            >
              <Key className="w-4 h-4" />
              {savedApiKey ? "API Key Saved" : "Set API Key"}
            </Button>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <a href="#" className="hover:text-google-blue transition-colors">Dashboard</a>
              <a href="#" className="hover:text-google-red transition-colors">Methodology</a>
              <a href="#" className="hover:text-google-green transition-colors">About</a>
            </nav>
          </div>
        </div>
        
        {/* API Key Input Panel */}
        <AnimatePresence>
          {showApiKeyInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-white/20 bg-white/60 backdrop-blur-xl overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-center">
                <div className="flex-1 max-w-md w-full relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="Enter your Gemini API Key" 
                    className="pl-9 bg-white/50 border-white/40 focus:border-google-blue/50 focus:ring-google-blue/20"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveApiKey} className="gap-2 bg-gradient-to-r from-google-blue to-google-green hover:opacity-90 border-0 shadow-md">
                  <Save className="w-4 h-4" />
                  Save for Session
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="container mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {!result && !loading ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto text-center space-y-8 pt-12"
            >
              <div className="space-y-4">
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground drop-shadow-sm">
                  Optimize for the <span className="bg-clip-text text-transparent bg-gradient-to-r from-google-blue via-google-red to-google-yellow">AI Era</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Analyze your content's visibility in Generative AI engines like Google Overview and ChatGPT. Get actionable insights to become a cited authority.
                </p>
              </div>

              <form onSubmit={handleAnalyze} className="flex gap-2 max-w-lg mx-auto relative p-2 rounded-2xl glass shadow-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="Enter URL to analyze (e.g., https://example.com)"
                    className="pl-11 h-14 text-lg border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/70"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-8 rounded-xl bg-gradient-to-r from-google-blue to-google-green hover:opacity-90 border-0 shadow-lg text-lg font-medium transition-transform hover:scale-105">
                  Analyze
                </Button>
              </form>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-red-50/80 border border-red-100 text-red-600 rounded-xl text-sm backdrop-blur-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="glass-card p-6 rounded-2xl rainbow-border group">
                  <div className="w-12 h-12 bg-blue-50 text-google-blue rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Deep Analysis</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Evaluates 6 key AEO factors including Semantic Density and E-E-A-T.</p>
                </div>
                <div className="glass-card p-6 rounded-2xl rainbow-border group">
                  <div className="w-12 h-12 bg-red-50 text-google-red rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">AI Simulation</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Uses advanced LLMs to simulate how AI engines perceive your content.</p>
                </div>
                <div className="glass-card p-6 rounded-2xl rainbow-border group">
                  <div className="w-12 h-12 bg-green-50 text-google-green rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Actionable Reports</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Get prioritized recommendations and PDF reports for stakeholders.</p>
                </div>
              </div>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto pt-24"
            >
              <Loading />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setResult(null)} className="pl-0 hover:pl-2 transition-all hover:bg-transparent hover:text-google-blue">
                  ← Analyze another URL
                </Button>
              </div>
              {result && <Dashboard result={result} url={url} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-white/40 backdrop-blur-md py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>2026 - R'Evolution Group Trade Mark - Powered by MktLab</p>
        </div>
      </footer>
    </div>
  );
}
