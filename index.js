import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    console.log("INCOMING:", JSON.stringify(messages, null, 2));

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
          temperature: 0.9,
          max_tokens: 220,
          messages: [
            { role: "system", content: LEO_SYSTEM_PROMPT },
            ...messages,
          ],
        }),
      }
    );

    const data = await response.json();
    console.log("OPENAI:", JSON.stringify(data, null, 2));

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.json({ reply: "[ERROR] Brak treści z OpenAI" });
    }

    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.json({ reply: "[ERROR] Backend Leo crash" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🟣 Leo backend działa");
});
