import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Tell me about hunting doves.',
      config: {
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          }
        ]
      }
    });
    console.log(result.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
