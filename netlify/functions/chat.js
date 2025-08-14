// Netlify Functions (Node 18+): fetch는 글로벌 제공
// 브라우저에서 CORS 에러를 막기 위해, 모든 응답에 CORS 헤더를 넣습니다.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",                 // 필요시 도메인으로 제한
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

exports.handler = async (event, context) => {
  // 1) CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  // 2) 메서드 체크
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS_HEADERS, body: "Method Not Allowed" };
  }

  // 3) 환경변수 체크
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: CORS_HEADERS, body: "Missing OPENAI_API_KEY" };
  }

  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return { statusCode: 400, headers: CORS_HEADERS, body: "Missing 'message' field" };
    }

    // 4) OpenAI 호출 (우선 비-스트리밍으로 정상 동작 확인)
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Logisbot. Reply in Korean, concise and helpful." },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        // stream: true  // 스트리밍은 나중 단계에서! 우선 성공 경로부터 확인
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return { statusCode: 502, headers: CORS_HEADERS, body: `Upstream error: ${text}` };
    }

    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content || "응답이 비어 있습니다.";

    // 5) 정상 응답
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: `Server error: ${err?.message || err}`,
    };
  }
};
