import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables in case this is imported in standalone tests
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. Please add it to your .env file.");
}

export const ai = new GoogleGenAI({ apiKey });

export const FAST_MODEL = "gemini-2.5-flash";
export const PRO_MODEL = "gemini-2.5-pro";

/**
 * Safely parse Gemini JSON response text, stripping markdown code wrappers if present.
 * @param {string} text 
 * @returns {any} parsed object or null
 */
export function parseGeminiJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    try {
      const clean = trimmed.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(clean);
    } catch (innerError) {
      console.error("Failed to parse Gemini JSON. Raw text was:", text);
      return null;
    }
  }
}
