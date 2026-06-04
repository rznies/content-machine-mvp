import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables in case this is imported in standalone tests
dotenv.config();

let currentKey = null;
let currentClient = null;

function getClient() {
  const key = process.env.GEMINI_API_KEY || "";
  if (!currentClient || key !== currentKey) {
    currentKey = key;
    currentClient = new GoogleGenAI({ apiKey: key });
  }
  return currentClient;
}

export const ai = new Proxy({}, {
  get(target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  }
});


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
