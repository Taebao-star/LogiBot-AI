const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: CORS, body: "" };
    }
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "missing_api_key" }) };
    }

    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "missing_message" }) };
    }

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Logisbot. Reply in Korean." },
          { role: "user", content: message },
        ],
        temperature: 0.3,
      }),
    });

    // 업스트림이 OK가 아니면 상세 에러 파싱해서 친절한 JSON 응답으로 변환
    if (!upstream.ok) {
      const text = await upstream.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch (e) { parsed = { raw: text }; }

      // OpenAI가 준 구조화된 에러가 있으면 그 내용을 사용
      const code = parsed?.error?.code || "upstream_error";
      const messageDetail = parsed?.error?.message || parsed?.raw || text;

      // 로그에 남기기 (Netlify 로그)
      console.error("OpenAI upstream error:", messageDetail);

      return {
        statusCode: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "upstream_error",
          upstream_code: code,
          message: messageDetail,
          user_friendly: code === "insufficient_quota"
            ? "현재 서비스 사용량을 초과했습니다. 관리자에게 문의하거나 잠시 후 다시 시도하세요."
            : "외부 응답 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        }),
      };
    }

    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content || "응답이 없습니다.";

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };

  } catch (err) {
    console.error("Function crash:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "server_error", message: err.message }) };
  }
};
