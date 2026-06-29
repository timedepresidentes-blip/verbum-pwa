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

  const { audio, mimeType } = body;
  if (!audio) {
    return { statusCode: 400, headers, body: JSON.stringify({erro: "Audio nao fornecido"}) };
  }

  const modelos = ["gemini-2.0-flash", "gemini-1.5-flash"];

  for (const modelo of modelos) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Transcreva este audio em portugues. Retorne APENAS o texto transcrito, sem explicacoes ou comentarios." },
                { inline_data: { mime_type: mimeType || "audio/webm", data: audio } }
              ]
            }],
            generationConfig: { temperature: 0, maxOutputTokens: 500 }
          })
        }
      );
      if (!r.ok) continue;
      const data = await r.json();
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (texto.trim()) {
        return { statusCode: 200, headers, body: JSON.stringify({ texto: texto.trim() }) };
      }
    } catch(e) {}
  }

  return { statusCode: 500, headers, body: JSON.stringify({ erro: "Falha na transcricao" }) };
};
