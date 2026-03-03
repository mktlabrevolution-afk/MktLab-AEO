import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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
    
    // Extract main content text (naive extraction)
    $("script, style, nav, footer, header").remove();
    const mainContent = $("body").text().replace(/\s+/g, " ").trim().substring(0, 15000); // Limit context window

    // Extract Schema Markup
    const schemaScripts = $('script[type="application/ld+json"]')
      .map((i, el) => $(el).html())
      .get();

    // 3. Construct Prompt for Gemini
    const prompt = `
      You are an expert AI Engine Optimization (AEO) Strategist. Analyze the following web page content for its ability to be cited by Generative AI engines (Google Overview, ChatGPT, etc.).
      
      URL: ${url}
      Title: ${title}
      Meta Description: ${metaDescription}
      H1 Tags: ${JSON.stringify(h1s)}
      H2 Tags: ${JSON.stringify(h2s)}
      Schema Markup Found: ${schemaScripts.length > 0 ? "Yes" : "No"} (Count: ${schemaScripts.length})
      Content Sample: ${mainContent}

      Evaluate the page based on these 6 criteria:
      1. Semantic Content & Quality (Depth, structure, clarity)
      2. Structured Data (Schema implementation)
      3. E-E-A-T (Expertise, Experience, Authoritativeness, Trustworthiness signals)
      4. UX & Core Web Vitals (Estimate based on structure/complexity)
      5. Search Intent & Topic Coverage
      6. Metadata Optimization

      Provide a JSON response with the following structure:
      {
        "overallScore": number (0-100),
        "criteriaScores": {
          "content": number (0-100),
          "structuredData": number (0-100),
          "eeat": number (0-100),
          "ux": number (0-100),
          "intent": number (0-100),
          "metadata": number (0-100)
        },
        "summary": "Executive summary for a CMO (max 3 sentences)",
        "recommendations": [
          { "priority": "High", "impact": "High", "action": "Specific action", "reason": "Why this matters for AEO" },
          { "priority": "Medium", "impact": "Medium", "action": "Specific action", "reason": "Why this matters for AEO" },
          { "priority": "Low", "impact": "Low", "action": "Specific action", "reason": "Why this matters for AEO" }
        ],
        "keywords": [
          { "term": "Keyword/Phrase", "reason": "Why this triggers AI citation" }
        ]
      }
    `;

    // 4. Call Gemini API
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
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
