// api/events.js — PredictHQ events proxy
// Set PREDICTHQ_KEY in Vercel environment variables
// Get your key at https://www.predicthq.com/

const PHQ_KEY = process.env.PREDICTHQ_KEY;
if (!PHQ_KEY) console.error("PREDICTHQ_KEY env var not set");

// Bloomfield NJ coordinates
const LAT  = "40.8126";
const LNG  = "-74.1854";
const RADIUS = "30mi";

const CATEGORY_MAP = {
  concerts:          "concerts",
  festivals:         "festivals",
  sports:            "sports",
  "community":       "community",
  "performing-arts": "performing-arts",
  "food-drink":      "festivals",
  "expos":           "expos",
  "conferences":     "conferences",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!PHQ_KEY) return res.status(200).json({ events: [], count: 0, error: "not configured" });
  const today = new Date().toISOString().split("T")[0];
  const in60days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { days = "30", category } = req.query;

  const params = new URLSearchParams({
    "location_around.origin": `${LAT},${LNG}`,
    "location_around.offset": RADIUS,
    "active.gte": today,
    "active.lte": in60days,
    "sort": "-rank",
    "limit": "50",
    "category": category || "concerts,festivals,sports,community,performing-arts,expos,conferences",
  });

  try {
    const r = await fetch(`https://api.predicthq.com/v1/events/?${params}`, {
      headers: {
        "Authorization": `Bearer ${PHQ_KEY}`,
        "Accept": "application/json",
      },
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: `PredictHQ ${r.status}: ${errText}` });
    }

    const data = await r.json();

    const events = (data.results || []).map(e => ({
      id:          e.id,
      title:       e.title,
      category:    e.category,
      labels:      e.labels || [],
      start:       e.start,
      end:         e.end,
      rank:        e.rank,
      local_rank:  e.local_rank,
      phq_attendance: e.phq_attendance,
      location:    e.geo?.geometry?.coordinates
        ? { lat: e.geo.geometry.coordinates[1], lng: e.geo.geometry.coordinates[0] }
        : null,
      entities: (e.entities || []).map(en => ({
        name:    en.name,
        type:    en.type,
        address: en.formatted_address,
      })),
    }));

    return res.status(200).json({
      events,
      count: events.length,
      next: data.next || null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
