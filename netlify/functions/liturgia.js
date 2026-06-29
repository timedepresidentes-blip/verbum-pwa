exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ erro: "Chave GROQ_API_KEY nao configurada" }) };
  }

  const hoje = new Date();
  const dia = hoje.getDate();
  const mes = hoje.getMonth() + 1;
  const nomeMes = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][mes-1];
  const ano = hoje.getFullYear();

  const prompt = `Liturgia catolica do dia ${dia} de ${nomeMes} de ${ano} no Brasil. Retorne APENAS JSON valido, sem markdown, sem explicacoes:
{"celebracao":"nome da celebracao","corLiturgica":"Verde","tempoLiturgico":"texto do tempo liturgico","leituras":[{"tipo":"Primeira Leitura","ref":"referencia","resumo":"titulo","texto":"texto completo"},{"tipo":"Salmo Responsorial","ref":"referencia","resumo":"refrao","texto":"texto do salmo"},{"tipo":"Evangelho","ref":"referencia","resumo":"titulo","texto":"texto completo"}]}`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_KEY
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!r.ok) throw new Error("Groq status " + r.status);

    const data = await r.json();
    const texto = data.choices?.[0]?.message?.content || "";
    const match = texto.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("sem JSON na resposta");
    JSON.parse(match[0]);
    return { statusCode: 200, headers, body: match[0] };

  } catch (e) {
    console.log("ERRO GROQ:", e.message);
    const diaStr = hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        _erro_debug: e.message,
        celebracao: "Liturgia do Dia",
        corLiturgica: "Verde",
        tempoLiturgico: "Tempo Comum — " + diaStr,
        leituras: [{
          tipo: "Aviso",
          ref: "--",
          resumo: "Servico temporariamente indisponivel",
          texto: "O servico de liturgia esta com instabilidade. Tente novamente em alguns minutos. Para a liturgia completa acesse: liturgia.cancaonova.com"
        }]
      })
    };
  }
};
