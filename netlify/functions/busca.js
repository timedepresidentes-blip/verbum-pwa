exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({erro: "Chave nao configurada"}) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({erro: "Body invalido"}) };
  }

  const { query, versiculos } = body;
  if (!query || !versiculos) {
    return { statusCode: 400, headers, body: JSON.stringify({erro: "Parametros faltando"}) };
  }

  const vTxt = versiculos.map((v, i) => `[${i}] ${v.r}: ${v.t}`).join("\n");
  const prompt = `Guia espiritual catolico. Usuario: "${query}". Versiculos:\n${vTxt}\nEscolha 4 mais adequados. Retorne APENAS JSON: {"indices":[0,1,2,3],"mensagem":"acolhimento em 15 palavras"}`;

  const modelos = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro"];

  for (const modelo of modelos) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 200 } })
        }
      );
      if (!r.ok) continue;
      const data = await r.json();
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const match = texto.match(/\{[\s\S]*\}/);
      if (match) return { statusCode: 200, headers, body: match[0] };
    } catch(e) {}
  }

  return { statusCode: 500, headers, body: JSON.stringify({ erro: "Erro na busca" }) };
};
