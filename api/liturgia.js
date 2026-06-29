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
{"celebracao":"nome da celebracao","corLiturgica":"Verde","tempoLiturgico":"texto","leituras":[{"tipo":"Primeira Leitura","ref":"ref","resumo":"titulo","texto":"texto completo"},{"tipo":"Salmo Responsorial","ref":"ref","resumo":"refrao","texto":"texto"},{"tipo":"Evangelho","ref":"ref","resumo":"titulo","texto":"texto completo"}],"santo":{"nome":"nome completo do santo do dia","wikipediaSlug":"nome_do_santo_sem_acentos_com_underline_para_busca_na_wikipedia_pt","historia":"historia breve do santo em 3 linhas","oracao":"oracao curta ao santo em 2 linhas"}}`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Voce e um especialista em liturgia catolica brasileira. Responda SEMPRE com JSON valido incluindo OBRIGATORIAMENTE todos os campos: celebracao, corLiturgica, tempoLiturgico, leituras (array com Primeira Leitura, Salmo Responsorial e Evangelho), e santo (com nome, wikipediaSlug, historia e oracao). Nunca omita o campo santo." },
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
      leituras: [{ tipo: "Aviso", ref: "--", resumo: "Servico temporariamente indisponivel",
        texto: "Tente novamente em alguns minutos. Liturgia completa: liturgia.cancaonova.com" }]
    });
  }
};
