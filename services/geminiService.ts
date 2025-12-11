import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, EmotionType, TempoType } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAudioSegment = async (audioBase64: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/wav',
              data: audioBase64
            }
          },
          {
            text: "Analyze this audio segment for generative art parameters."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: { type: Type.STRING, enum: ['Happy', 'Sad', 'Angry', 'Calm', 'Neutral', 'Excited', 'Anxious'] },
            confidence: { type: Type.NUMBER },
            tempo: { type: Type.STRING, enum: ['Slow', 'Medium', 'Fast'] },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING, description: "A short accessible description of the art style implied." }
          },
          required: ['emotion', 'confidence', 'tempo', 'keywords', 'colors', 'description']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

    return {
      emotion: data.emotion as EmotionType,
      confidence: data.confidence,
      tempo: data.tempo as TempoType,
      keywords: data.keywords || [],
      colors: data.colors || ['#ffffff'],
      description: data.description || "Abstract art based on voice."
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a fallback so the app doesn't crash
    return {
      emotion: 'Neutral',
      confidence: 0,
      tempo: 'Medium',
      keywords: [],
      colors: ['#cccccc', '#888888', '#ffffff'],
      description: "Neutral fallback art."
    };
  }
};
