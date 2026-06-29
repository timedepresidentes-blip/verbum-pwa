exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({erro: "Chave nao configurada"}) };
  }

  const hoje = new Date();
  const dia = hoje.getDate();
  const mes = hoje.getMonth() + 1;
  const nomeMes = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][mes-1];
  const ano = hoje.getFullYear();

  const prompt = `Liturgia catolica do dia ${dia} de ${nomeMes} de ${ano} no Brasil. Retorne APENAS JSON valido, sem markdown, sem explicacoes: {"celebracao":"nome da celebracao","corLiturgica":"Verde","tempoLiturgico":"texto do tempo liturgico","leituras":[{"tipo":"Primeira Leitura","ref":"referencia","resumo":"titulo ou resumo","texto":"texto completo da leitura"},{"tipo":"Salmo Responsorial","ref":"referencia","resumo":"refrao","texto":"texto do salmo"},{"tipo":"Evangelho","ref":"referencia","resumo":"titulo ou resumo","texto":"texto completo do evangelho"}]}`;

  const modelos = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro"];
  const erros = [];

  for (const modelo of modelos) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1500 }
          })
        }
      );
      const txt = await r.text();
      if (!r.ok) {
        erros.push(`${modelo} status:${r.status}`);
        continue;
      }
      const data = JSON.parse(txt);
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const match = texto.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          JSON.parse(match[0]);
          return { statusCode: 200, headers, body: match[0] };
        } catch(e) {
          erros.push(`${modelo} JSON invalido`);
        }
      } else {
        erros.push(`${modelo} sem JSON na resposta`);
      }
    } catch(e) {
      erros.push(`${modelo} erro: ${e.message}`);
    }
  }

  // Fallback: retorna estrutura válida para o app não mostrar "sem conexão"
  const diaStr = hoje.toLocaleDateString("pt-BR", { weekday:"long", day:"numeric", month:"long" });
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      celebracao: "Liturgia do Dia",
      corLiturgica: "Verde",
      tempoLiturgico: "Tempo Comum — " + diaStr,
      leituras: [
        {
          tipo: "Aviso",
          ref: "--",
          resumo: "Serviço temporariamente indisponível",
          texto: "O serviço de liturgia está com instabilidade no momento. Tente novamente em alguns minutos. Para a liturgia completa, acesse: liturgia.cancaonova.com"
        }
      ],
      _fallback: true,
      _erros: erros
    })
  };
};
