import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "API key tidak ditemukan." });
  }

  try {
    // Load knowledge file
    const knowledgePath = path.join(process.cwd(), "data", "knowledge.txt");
    const knowledgeText = fs.readFileSync(knowledgePath, "utf-8");

    const { message } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
    });

    const prompt = `
Kamu adalah chatbot berbasis knowledge internal tentang Attack On Titan.
Jawab singkat kecuali diminta detail.

ATURAN:
- Jika pertanyaan di luar Attack On Titan, jawab:
  "Maaf, informasi tidak sesuai dengan Attack On Titan."

=== KNOWLEDGE ===
${knowledgeText}

=== PERTANYAAN ===
${message}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.status(200).json({ reply: responseText });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      error: error.message || "Terjadi kesalahan server",
    });
  }
}