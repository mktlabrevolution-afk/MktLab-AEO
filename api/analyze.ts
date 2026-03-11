import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import axios from "axios";
import * as cheerio from "cheerio";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log(`[API] Received ${req.method} request to /api/analyze`);

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let requestHistory = rateLimitMap.get(ip) || [];
    requestHistory = requestHistory.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);

    if (requestHistory.length >= MAX_REQUESTS_PER_WINDOW) {
        console.warn(`[API] Rate limit exceeded for IP: ${ip}`);
        return res.status(429).json({ 
            error: "Too Many Requests", 
            message: "Has excedido el límite de 3 análisis por minuto. Por favor, espera unos segundos e intenta de nuevo." 
        });
    }

    requestHistory.push(now);
    rateLimitMap.set(ip, requestHistory);

    try {
        const { url, apiKey } = req.body;
        const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;

        if (!effectiveApiKey || effectiveApiKey === "MY_GEMINI_API_KEY") {
            return res.status(400).json({
                error: "API Key is missing or invalid. Please provide a valid Gemini API Key in the settings or environment variables."
            });
        }

        const client = new GoogleGenAI({ apiKey: effectiveApiKey });

        const response = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            },
            timeout: 10000,
        });
        
        const html = response.data;

        const $ = cheerio.load(html);
        const title = $("title").text();
        const metaDescription = $('meta[name="description"]').attr("content") || "";
        const h1s = $("h1").map((i, el) => $(el).text()).get();
        const h2s = $("h2").map((i, el) => $(el).text()).get().slice(0, 5);

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

        $("script, style, nav, footer, header").remove();
        const mainContent = $("body").text().replace(/\s+/g, " ").trim().substring(0, 15000);

        const prompt = `
      Eres un experto Estratega de Optimización para Motores de IA (AEO). Analiza el contenido de la siguiente página web para determinar su capacidad de ser citada por motores de IA Generativa.
      
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

      Proporciona una respuesta JSON con esta estructura exacta (todo en español):
      {
        "overallScore": número (0-100),
        "criteriaScores": { "content": número, "structuredData": número, "eeat": número, "ux": número, "intent": número, "metadata": número },
        "summary": "Resumen ejecutivo corto",
        "recommendations": [ { "priority": "Alta", "impact": "Alto", "action": "Acción específica", "reason": "Por qué importa" } ],
        "keywords": [ { "term": "Palabra", "reason": "Razón" } ]
      }
    `;

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
        return res.status(200).json(analysis);

    } catch (error: any) {
        if (error.isAxiosError) {
          return res.status(500).json({ error: "Failed to fetch URL content", details: error.message });
        }
        res.status(500).json({ error: "Failed to analyze URL", details: error.message || String(error) });
    }
}
