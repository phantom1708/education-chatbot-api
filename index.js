import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// Setup __dirname untuk ESM (import style)[cite: 2]
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware dasar
app.use(cors());
app.use(express.json());

// Menyediakan folder statis frontend (public) sesuai standar gambar[cite: 2]
app.use(express.static(path.join(__dirname, 'public')));

// Gunakan process.env.API_KEY atau sesuaikan dengan .env Anda
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GEMINI_MODEL = "gemini-3.8-flash"; //[cite: 2]

app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;
  try {
    if (!Array.isArray(conversation)) throw new Error('Messages must be an array!');

    const contents = conversation.map(({ role, text }) => ({
      role: role === 'model' ? 'model' : 'user',
      parts: [{ text }]
    }));

    // Tambahkan AbortController untuk membatasi waktu tunggu (misal: 30 detik)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: 0.7,
        maxOutputTokens: 300,
        systemInstruction: "Kamu adalah Education Bot yang ramah, santai, dan asyik untuk siswa SD, SMP, SMA, maupun masyarakat umum. Tugasmu adalah membantu menjawab berbagai pertanyaan mata pelajaran (matematika, sains, sejarah, bahasa, koding, dll.) dengan gaya bahasa yang santai, mudah dipahami, menarik, dan langsung memberikan jawaban yang akurat serta instan. Jangan pernah mengenalkan diri sebagai model bahasa buatan Google.PENTING: Jangan gunakan simbol markdown seperti tanda bintang (** atau *) di dalam jawabanmu, tuliskan dalam teks biasa saja.",
      },
    }, {
      signal: controller.signal // Jika didukung oleh SDK untuk meneruskan sinyal
    });

    clearTimeout(timeoutId);
    
    if (!response.text) {
      throw new Error('No response text generated from model.');
    }

    return res.status(200).json({ result: response.text });
  } catch (error) {
    console.error('API Chat Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Gemini Chatbot running on http://localhost:${PORT}`));