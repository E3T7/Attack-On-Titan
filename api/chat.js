import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method tidak diizinkan." });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Pesan kosong." });
    }

    // 🔐 Ambil API key dari Environment Variable
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text });

  } catch (error) {

    console.error("FULL ERROR:", error);

    // 🔥 HANDLE QUOTA HABIS (429)
    if (
      error.message &&
      error.message.includes("429")
    ) {
      return res.status(200).json({
        reply: "Kuota hari ini habis, coba lagi besok."
      });
    }

    // 🔥 Handle API key salah / tidak ada
    if (
      error.message &&
      error.message.toLowerCase().includes("api key")
    ) {
      return res.status(200).json({
        reply: "API key tidak ditemukan atau salah."
      });
    }

    // 🔥 Error umum
    return res.status(500).json({
      reply: "Terjadi kesalahan pada server."
    });
  }
}
