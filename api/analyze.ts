import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import * as cheerio from "cheerio";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Simple in-memory rate limiter definition
// Maps IP to an array of request timestamps.
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log(`[API] Received ${req.method} request to /api/analyze`);

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // --- Rate Limiting Logic ---
    // Extract IP from Vercel's proxy headers or fallback to an empty string
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Get request history for this IP
    let requestHistory = rateLimitMap.get(ip) || [];

    // Filter out timestamps older than the window
    requestHistory = requestHistory.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);

    // Check if the limit is exceeded
    if (requestHistory.length >= MAX_REQUESTS_PER_WINDOW) {
        console.warn(`[API] Rate limit exceeded for IP: ${ip}`);
        return res.status(429).json({
            error: "Too Many Requests",
            message: "Has excedido el límite de 3 análisis por minuto. Por favor, espera unos segundos e intenta de nuevo."
        });
    }

    // Add current request timestamp and save back to map
    requestHistory.push(now);
    rateLimitMap.set(ip, requestHistory);
    console.log(`[API] Request allowed for IP: ${ip}. Remaining quota: ${MAX_REQUESTS_PER_WINDOW - requestHistory.length}`);
    // --- End Rate Limiting Logic ---

    try {
        const { url, apiKey } = req.body;
        console.log(`[API] Payload received. URL: ${url ? url : 'MISSING'}. User provided key: ${apiKey ? 'YES' : 'NO'}`);

        if (!url) {
            console.log(`[API] Rejecting request: URL is required`);
            return res.status(400).json({ error: "URL is required" });
        }

        // Determine which API key to use
        const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;

        if (!effectiveApiKey || effectiveApiKey === "MY_GEMINI_API_KEY") {
            console.log(`[API] Rejecting request: Valid API key not found in env or payload.`);
            return res.status(400).json({
                error: "API Key is missing or invalid. Please provide a valid Gemini API Key in the settings or environment variables."
            });
        }

        // Initialize Gemini API with the effective key
        console.log(`[API] Initializing Gemini API...`);
        const client = new GoogleGenAI({ apiKey: effectiveApiKey });

        console.log(`[API] Pre-flight fetch for URL: ${url}`);

        // 1. Fetch HTML content
        const response = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            },
            timeout: 10000,
        });

        console.log(`[API] HTML fetched successfully. Status: ${response.status}`);
        const html = response.data;

        // 2. Parse HTML with Cheerio
        console.log(`[API] Parsing HTML with cheerio...`);
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

        // Extract main content text (naive extraction)
        $("script, style, nav, footer, header").remove();
        const mainContent = $("body").text().replace(/\s+/g, " ").trim().substring(0, 15000); // Limit context window

        // Extract Schema Markup
        const schemaScripts = $('script[type="application/ld+json"]')
            .map((i, el) => $(el).html())
            .get();

        // 3. Construct Prompt for Gemini
        console.log(`[API] Constructing prompt for Gemini...`);
        const prompt = `
      Eres un experto Estratega de Optimización para Motores de IA (AEO). Analiza el contenido de la siguiente página web para determinar su capacidad de ser citada por motores de IA Generativa (Google Overview, ChatGPT, etc.).
      
      URL: ${url}
      Título: ${title}
      Meta Descripción: ${metaDescription}
      Etiquetas H1: ${JSON.stringify(h1s)}
      Etiquetas H2: ${JSON.stringify(h2s)}
      Marcado Schema Encontrado: ${schemaScripts.length > 0 ? "Sí" : "No"} (Cantidad: ${schemaScripts.length})
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
        console.log(`[API] Calling Gemini API...`);
        const result = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        console.log(`[API] Gemini API response received.`);
        const analysis = JSON.parse(result.text || "{}");
        return res.status(200).json(analysis);

    } catch (error: any) {
        console.error("[API] Critical Analysis error:", error);

        // Special case for Axios errors (like site blocking scraping)
        if (error.isAxiosError) {
            return res.status(500).json({
                error: "Failed to fetch URL content",
                details: error.message,
                status: error.response?.status
            });
        }

        res.status(500).json({
            error: "Failed to analyze URL",
            details: error.message || String(error)
        });
    }
}
