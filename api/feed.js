module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const upstream = await fetch("https://system2-control-center.vercel.app/api/feed", {
      method: "GET",
      headers: { "accept": "application/json" },
      cache: "no-store"
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: "Upstream feed unavailable", detail: String(e && e.message || e) });
  }
}