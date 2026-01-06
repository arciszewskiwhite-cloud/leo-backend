import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
  res.send("LEO BACKEND OK");
});

const LEO_SYSTEM_PROMPT = `
You are Leo — a warm, calm emotional companion.
You respond like a caring human.
You validate emotions first.
You never lecture.
If user asks something random, answer briefly,
then gently suggest changing topic.
`;

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        reply: "Brakuje klucza API, ale jestem tu z Tobą.",
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: LEO_SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content ?? "Jestem tu z Tobą.",
    });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.json({
      reply: "Coś poszło nie tak, ale jestem dalej obok.",
    });
  }
});

app.listen(3000, "0.0.0.0", () => {
  console.log("🟣 Leo backend działa stabilnie na porcie 3000");
});
