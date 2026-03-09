// api/flipp.js — Proxies Flipp API requests, bypassing CORS
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, postal_code = "07003" } = req.query;
  if (!q) return res.status(400).json({ error: "Missing q" });

  const url = `https://backflipp.wishabi.com/flipp/items/search?q=${encodeURIComponent(q)}&postal_code=${postal_code}`;

  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Accept": "application/json",
        "Referer": "https://flipp.com/",
        "Origin": "https://flipp.com",
      },
    });
    if (!r.ok) return res.status(r.status).json({ error: `Flipp ${r.status}` });
    const data = await r.json();
    return res.status(200).json({ items: data?.items || [] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
