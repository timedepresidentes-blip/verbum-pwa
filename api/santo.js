module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).end();

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return res.status(500).json({ erro: "GROQ_API_KEY nao configurada" });

  const hoje = new Date();
  const dia = hoje.getDate();
  const mes = hoje.getMonth() + 1;
  const nomeMes = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][mes-1];
  const ano = hoje.getFullYear();

  const prompt = `Qual e o santo ou beato principal do dia ${dia} de ${nomeMes} de ${ano} no calendario liturgico catolico romano? Retorne APENAS JSON: {"nome":"nome completo do santo","wikipediaSlug":"slug_exato_do_artigo_na_wikipedia_portugues","historia":"breve historia do santo em 3 frases","oracao":"oracao curta ao santo em 2 frases"}`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 600,
        response_format: { type: "json_object" }
      })
    });
    if (!r.ok) throw new Error("Groq status " + r.status);
    const data = await r.json();
    const texto = data.choices?.[0]?.message?.content || "";
    return res.status(200).json(JSON.parse(texto));
  } catch (e) {
    return res.status(200).json({ nome: "", historia: "", oracao: "", wikipediaSlug: "" });
  }
};
