import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   HEALTHCHECK (Railway)
========================= */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.status(200).send("Leo backend OK");
});

/* =========================
   SYSTEM PROMPT
========================= */
const LEO_SYSTEM_PROMPT = `
You are Leo — a calm, human emotional companion.
You must respond directly to the user's message.
You are forbidden from replying with generic phrases alone
like "I am here with you".

Each reply must reference something specific
from what the user just said.

No advice unless the user asks for it.
Keep replies short, warm, and natural.
`;

/* =========================
   CHAT ENDPOINT
========================= */
app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.json({
        reply: "[ERROR] messages must be an array",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        reply: "[ERROR] OPENAI_API_KEY not set on backend",
      });
    }

    console.log("INCOMING MESSAGES:", JSON.stringify(messages, null, 2));

    // ⏱️ timeout zabezpieczający Railway
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000); // 12s

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.8,
          max_tokens: 220,
          messages: [
            { role: "system", content: LEO_SYSTEM_PROMPT },
            ...messages,
          ],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      console.error("OPENAI ERROR:", response.status, text);

      return res.json({
        reply: `[ERROR] OpenAI ${response.status}: ${text}`,
      });
    }

    const data = await response.json();
    console.log("OPENAI RAW:", JSON.stringify(data, null, 2));

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply || typeof reply !== "string") {
      return res.json({
        reply: "[ERROR] OpenAI returned no message content",
      });
    }

    return res.json({ reply });
  } catch (err) {
    console.error("CHAT CRASH:", err);

    return res.json({
      reply: "[ERROR] Timeout or backend crash while calling OpenAI",
    });
  }
});

/* =========================
   START SERVER (Railway)
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🟣 Leo backend running on port ${PORT}`);
});
