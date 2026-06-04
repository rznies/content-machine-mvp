import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

console.log("process.env.GEMINI_API_KEY length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log("process.env.GEMINI_API_KEY raw value:", process.env.GEMINI_API_KEY);

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log("No API key found.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

try {
  console.log("Testing generation...");
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Hello"
  });
  console.log("SUCCESS! Response:", response.text);
} catch (err) {
  console.error("FAILED calling Gemini:", err.message);
  console.error(err);
}
