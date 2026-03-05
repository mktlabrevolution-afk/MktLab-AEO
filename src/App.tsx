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
    <div className="min-h-screen font-sans selection:bg-brand-green/30">
      {/* Navbar */}
      <header className="border-b border-white/20 bg-white/60 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-bold text-xl tracking-tight text-brand-navy leading-none">
              R'Evolution
            </h1>
            <span className="text-xs font-medium text-brand-navy/70 tracking-wide uppercase">Education Group</span>
          </div>
          <div className="flex items-center gap-4">
             <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-brand-navy/70 hover:text-brand-navy hover:bg-brand-navy/5 transition-all rounded-full"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            >
              <Key className="w-4 h-4" />
              {savedApiKey ? "API Key Guardada" : "Configurar API Key"}
            </Button>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-brand-navy/80">
              <a href="#" className="hover:text-brand-green transition-colors">Panel</a>
              <a href="#" className="hover:text-brand-green transition-colors">Metodología</a>
              <a href="#" className="hover:text-brand-green transition-colors">Acerca de</a>
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
              className="border-b border-white/20 bg-white/80 backdrop-blur-xl overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-center">
                <div className="flex-1 max-w-md w-full relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/50" />
                  <Input 
                    type="password" 
                    placeholder="Ingresa tu Gemini API Key" 
                    className="pl-9 bg-white border-brand-navy/10 focus:border-brand-navy/30 focus:ring-brand-navy/10 text-brand-navy"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveApiKey} className="gap-2 bg-brand-navy hover:bg-brand-navy/90 text-white border-0 shadow-md">
                  <Save className="w-4 h-4" />
                  Guardar para la Sesión
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
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-brand-navy drop-shadow-sm">
                  Optimiza para la <span className="text-brand-green">Era de la IA</span>
                </h2>
                <p className="text-xl text-brand-navy/70 leading-relaxed max-w-2xl mx-auto font-light">
                  Analiza la visibilidad de tu contenido en motores de IA Generativa como Google Overview y ChatGPT. Obtén información procesable para convertirte en una autoridad citada.
                </p>
              </div>

              <form onSubmit={handleAnalyze} className="flex gap-2 max-w-lg mx-auto relative p-2 rounded-2xl glass shadow-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-navy/50" />
                  <Input
                    type="url"
                    placeholder="Ingresa URL para analizar (ej. https://ejemplo.com)"
                    className="pl-11 h-14 text-lg border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-brand-navy/40 text-brand-navy"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-8 rounded-xl bg-brand-green hover:bg-brand-green/90 text-white border-0 shadow-lg text-lg font-medium transition-transform hover:scale-105">
                  Analizar
                </Button>
              </form>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm backdrop-blur-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="glass-card p-6 rounded-2xl brand-border group">
                  <div className="w-12 h-12 bg-brand-navy/5 text-brand-navy rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-navy group-hover:text-white transition-all duration-300">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-brand-navy">Análisis Profundo</h3>
                  <p className="text-sm text-brand-navy/60 leading-relaxed">Evalúa 6 factores clave de AEO, incluyendo Densidad Semántica y E-E-A-T.</p>
                </div>
                <div className="glass-card p-6 rounded-2xl brand-border group">
                  <div className="w-12 h-12 bg-brand-green/10 text-brand-green rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-green group-hover:text-white transition-all duration-300">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-brand-navy">Simulación de IA</h3>
                  <p className="text-sm text-brand-navy/60 leading-relaxed">Utiliza LLMs avanzados para simular cómo los motores de IA perciben tu contenido.</p>
                </div>
                <div className="glass-card p-6 rounded-2xl brand-border group">
                  <div className="w-12 h-12 bg-brand-navy/5 text-brand-navy rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-navy group-hover:text-white transition-all duration-300">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-brand-navy">Reportes Accionables</h3>
                  <p className="text-sm text-brand-navy/60 leading-relaxed">Obtén recomendaciones priorizadas y reportes en PDF para las partes interesadas.</p>
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
                <Button variant="ghost" onClick={() => setResult(null)} className="pl-0 hover:pl-2 transition-all hover:bg-transparent hover:text-brand-green text-brand-navy">
                  ← Analizar otra URL
                </Button>
              </div>
              {result && <Dashboard result={result} url={url} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-white/40 backdrop-blur-md py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-brand-navy/60">
          <p>2026 - R'Evolution Group Trade Mark - Powered by MktLab</p>
        </div>
      </footer>
    </div>
  );
}
