import fetch from "node-fetch";

export async function handler(event) {
  const { userMessage } = JSON.parse(event.body);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are Logisbot." },
        { role: "user", content: userMessage }
      ]
    })
  });

  const data = await res.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
}