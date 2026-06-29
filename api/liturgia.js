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

  const prompt = `Liturgia catolica do dia ${dia} de ${nomeMes} de ${ano} no Brasil. Retorne APENAS JSON valido:
{"celebracao":"nome da celebracao","corLiturgica":"Verde","tempoLiturgico":"texto","leituras":[{"tipo":"Primeira Leitura","ref":"ref","resumo":"titulo","texto":"texto completo"},{"tipo":"Salmo Responsorial","ref":"ref","resumo":"refrao","texto":"texto"},{"tipo":"Evangelho","ref":"ref","resumo":"titulo","texto":"texto completo"}]}`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Voce e um especialista em liturgia catolica brasileira. Responda SEMPRE com JSON valido contendo: celebracao, corLiturgica, tempoLiturgico e leituras." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 6000,
        response_format: { type: "json_object" }
      })
    });
    if (!r.ok) throw new Error("Groq status " + r.status);
    const data = await r.json();
    const texto = data.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(texto);
    return res.status(200).json(parsed);
  } catch (e) {
    const diaStr = hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    return res.status(200).json({
      celebracao: "Liturgia do Dia",
      corLiturgica: "Verde",
      tempoLiturgico: "Tempo Comum — " + diaStr,
      leituras: [{ tipo: "Aviso", ref: "--", resumo: "Serviço temporariamente indisponível",
        texto: "Tente novamente em alguns minutos. Liturgia completa: liturgia.cancaonova.com" }]
    });
  }
};
