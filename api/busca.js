module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).end();

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return res.status(500).json({ erro: "GROQ_API_KEY nao configurada" });

  const { query, versiculos } = req.body || {};
  if (!query || !versiculos) return res.status(400).json({ erro: "Parametros faltando" });

  const vTxt = versiculos.map((v, i) => `[${i}] ${v.r}: ${v.t}`).join("\n");
  const prompt = `Guia espiritual catolico. Usuario: "${query}". Versiculos:\n${vTxt}\nEscolha 4 mais adequados. Retorne APENAS JSON: {"indices":[0,1,2,3],"mensagem":"acolhimento em 15 palavras"}`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: "json_object" }
      })
    });
    if (!r.ok) throw new Error("Groq status " + r.status);
    const data = await r.json();
    const texto = data.choices?.[0]?.message?.content || "";
    return res.status(200).json(JSON.parse(texto));
  } catch (e) {
    return res.status(500).json({ erro: "Erro na busca" });
  }
};
