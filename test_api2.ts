import { GoogleGenAI } from "@google/genai";

async function test() {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log(Object.keys(client));
}
test();
