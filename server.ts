import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
  console.error("CRITICAL: Invalid or missing GEMINI_API_KEY. Please check your secrets.");
}
const ai = new GoogleGenAI({ apiKey: apiKey });

// API Route for AEO Analysis
app.post("/api/analyze", async (req, res) => {
  try {
    const { url, apiKey } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Determine which API key to use
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!effectiveApiKey || effectiveApiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({ 
        error: "API Key is missing or invalid. Please provide a valid Gemini API Key in the settings or environment variables." 
      });
    }

    // Initialize Gemini API with the effective key
    const client = new GoogleGenAI({ apiKey: effectiveApiKey });

    console.log(`Analyzing URL: ${url}`);

    // 1. Fetch HTML content
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
      timeout: 10000,
    });
    const html = response.data;

    // 2. Parse HTML with Cheerio
    const $ = cheerio.load(html);
    const title = $("title").text();
    const metaDescription = $('meta[name="description"]').attr("content") || "";
    const h1s = $("h1")
      .map((i, el) => $(el).text())
      .get();
    const h2s = $("h2")
      .map((i, el) => $(el).text())
      .get()
      .slice(0, 5); // Limit to first 5
    
    // Extract Schema Markup BEFORE removing scripts
    const schemaScripts = $('script[type="application/ld+json"]').map((i, el) => {
      try {
          return JSON.parse($(el).html() || "{}");
      } catch (e) {
          return { error: "Invalid JSON-LD" };
      }
    }).get();
    
    // Limitar la cantidad de schemas a enviar para que no rompa el límite del prompt
    const schemaString = schemaScripts.length > 0 
        ? JSON.stringify(schemaScripts, null, 2).substring(0, 5000) 
        : "No se encontró marcado Schema o hubo un error al leerlo.";

    // Extract main content text (naive extraction)
    $("script, style, nav, footer, header").remove();
    const mainContent = $("body").text().replace(/\s+/g, " ").trim().substring(0, 15000); // Limit context window

    // 3. Construct Prompt for Gemini
    const prompt = `
      Eres un experto Estratega de Optimización para Motores de IA (AEO). Analiza el contenido de la siguiente página web para determinar su capacidad de ser citada por motores de IA Generativa (Google Overview, ChatGPT, etc.).
      
      URL: ${url}
      Título: ${title}
      Meta Descripción: ${metaDescription}
      Etiquetas H1: ${JSON.stringify(h1s)}
      Etiquetas H2: ${JSON.stringify(h2s)}
      Marcado Schema Encontrado (${schemaScripts.length}):
      ${schemaString}
      Muestra de Contenido: ${mainContent}

      Evalúa la página basándote en estos 6 criterios:
      1. Contenido Semántico y Calidad (Profundidad, estructura, claridad)
      2. Datos Estructurados (Implementación de Schema)
      3. E-E-A-T (Señales de Experiencia, Conocimiento, Autoridad, Confianza)
      4. UX y Core Web Vitals (Estimación basada en estructura/complejidad)
      5. Intención de Búsqueda y Cobertura del Tema
      6. Optimización de Metadatos

      Proporciona una respuesta JSON con la siguiente estructura (asegúrate de que todo el texto esté en español):
      {
        "overallScore": número (0-100),
        "criteriaScores": {
          "content": número (0-100),
          "structuredData": número (0-100),
          "eeat": número (0-100),
          "ux": número (0-100),
          "intent": número (0-100),
          "metadata": número (0-100)
        },
        "summary": "Resumen ejecutivo para un CMO (máximo 3 oraciones)",
        "recommendations": [
          { "priority": "Alta", "impact": "Alto", "action": "Acción específica", "reason": "Por qué esto importa para AEO" },
          { "priority": "Media", "impact": "Medio", "action": "Acción específica", "reason": "Por qué esto importa para AEO" },
          { "priority": "Baja", "impact": "Bajo", "action": "Acción específica", "reason": "Por qué esto importa para AEO" }
        ],
        "keywords": [
          { "term": "Palabra/Frase Clave", "reason": "Por qué esto activa la citación de IA" }
        ]
      }
    `;

    // 4. Call Gemini API
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ],
      },
    });

    const analysis = JSON.parse(result.text || "{}");
    res.json(analysis);

  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({ 
      error: "Failed to analyze URL", 
      details: error.message 
    });
  }
});

// Vite Middleware
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
