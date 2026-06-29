module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).end();

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return res.status(500).json({ erro: "GROQ_API_KEY nao configurada" });

  const { audio, mimeType } = req.body || {};
  if (!audio) return res.status(400).json({ erro: "Audio nao fornecido" });

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: [
            { type: "text", text: "Transcreva este audio em portugues. Retorne apenas o texto transcrito." },
            { type: "image_url", image_url: { url: `data:${mimeType || "audio/webm"};base64,${audio}` } }
          ]}
        ],
        max_tokens: 500
      })
    });
    if (!r.ok) throw new Error("status " + r.status);
    const data = await r.json();
    const texto = data.choices?.[0]?.message?.content || "";
    if (!texto.trim()) throw new Error("sem texto");
    return res.status(200).json({ texto: texto.trim() });
  } catch (e) {
    return res.status(500).json({ erro: "Falha na transcricao" });
  }
};
