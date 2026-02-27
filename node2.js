require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// enable CORS for all origins (adjust as needed for production)
app.use(cors({
  origin: '*',            // allow any origin
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.static("style")); // untuk load html

// Serve index.html for root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "style", "index.html"));
});

// ==============================
// Load Knowledge TXT
// ==============================
const knowledgeText = fs.readFileSync("data/knowledge.txt", "utf-8");

// ==============================
// Setup Gemini
// ==============================
if (!process.env.GEMINI_API_KEY) {
  console.error("API key tidak ditemukan.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "models/gemini-2.5-flash",
});

// ==============================
// Memory
// ==============================
let conversationHistory = [];

// ==============================
// Build Prompt
// ==============================
function buildPrompt(question) {
  const historyText = conversationHistory
    .map((msg) => `${msg.role}: ${msg.text}`)
    .join("\n");

  return `
Kamu adalah chatbot berbasis knowledge internal.
Sebutan yang dia panggil pakai itu untuk balas ke user
Kamu adalah chatbot yang mengetahui semua informasi tentang Attack On Titan, termasuk karakter, plot, dan detail dunia dalam cerita tersebut.
Kamu akan menjawab perntanyaan dengan singkat, tunggu dia minta jelasin tanya tentang apa, baru kamu jelasin dengan detail.
ATURAN:
- Topik utama kamu itu berdasarkan knowledge.
- Jika di luar knowledge, katakan:
  "Maaf, informasi tidak sesuai dengan Attack On Titan."

=== KNOWLEDGE ===
${knowledgeText}

=== PERCAKAPAN ===
${historyText}

=== PERTANYAAN ===
${question}
`;
}

// ==============================
// API Endpoint
// ==============================
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  const prompt = buildPrompt(userMessage);

  try {
    const result = await model.generateContent(prompt);
    
    const response = result.response.text();

    conversationHistory.push({ role: "User", text: userMessage });
    conversationHistory.push({ role: "Bot", text: response });

    if (conversationHistory.length > 2) { 
      conversationHistory = conversationHistory.slice(-2);
    }

    res.json({ reply: response });
  } catch (error) {
    const errorMsg = error.message || String(error);
    console.error("[ERROR]", errorMsg);
    
    // Log to file untuk debugging
    fs.appendFileSync("error.log", `[${new Date().toISOString()}] ${errorMsg}\n`);
    
    res.status(500).json({ error: errorMsg });
  }
});

// ==============================
// Run Server
// ==============================
app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});
