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
    const audioBuffer = Buffer.from(audio, "base64");
    const blob = new Blob([audioBuffer], { type: mimeType || "audio/webm" });

    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", "pt");
    formData.append("response_format", "json");

    const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + GROQ_KEY },
      body: formData
    });

    if (!r.ok) {
      const err = await r.text();
      throw new Error("Groq Whisper status " + r.status + ": " + err);
    }

    const data = await r.json();
    return res.status(200).json({ texto: data.text || "" });
  } catch (e) {
    return res.status(500).json({ erro: e.message });
  }
};
