// Vercel Serverless Function: 페이지의 AI 어시스트 요청을 Anthropic API로 전달
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY 환경변수가 없습니다" });
  const code = process.env.ACCESS_CODE;
  if (code && req.headers["x-access-code"] !== code) return res.status(401).json({ error: "접속 코드가 틀렸습니다" });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const { system = "", user = "", maxTokens = 1500 } = body || {};
  if (!user || user.length > 60000) return res.status(400).json({ error: "요청이 비었거나 너무 깁니다" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.MODEL || "claude-sonnet-4-6", max_tokens: Math.min(4000, Number(maxTokens) || 1500), system, messages: [{ role: "user", content: user }] })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || "API 오류" });
    const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("\n");
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
