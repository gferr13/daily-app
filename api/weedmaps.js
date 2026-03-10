// Weedmaps discovery API proxy
// Uses the v1 discovery endpoint with lat/lng + include[]=deals
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { lat, lng, radius = 15 } = req.query;
  const latitude  = parseFloat(lat)  || 40.8126;
  const longitude = parseFloat(lng)  || -74.1854;
  const distanceMi = parseFloat(radius) || 15;

  try {
    const url = `https://api-g.weedmaps.com/discovery/v1/listings?filter[any_retailer]=true&filter[latlng]=${latitude},${longitude}&filter[distance]=${distanceMi}&size=20&include[]=deals&include[]=menu_items`;

    const r = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://weedmaps.com",
        "Referer": "https://weedmaps.com/",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Cache-Control": "no-cache",
      },
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: `Weedmaps ${r.status}`, detail: text.slice(0, 300) });
    }

    const data = await r.json();
    const listings = (data?.data?.listings || []).map(l => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      address: l.address ? `${l.address}, ${l.city}, ${l.state}` : l.city,
      city: l.city,
      lat: l.latitude,
      lng: l.longitude,
      distance: l.distance?.[0] ?? null,
      rating: l.rating,
      reviews_count: l.reviews_count,
      open_now: l.open_now,
      closes_in: l.closes_in,
      todays_hours: l.todays_hours_str,
      license_type: l.license_type,
      has_featured_deal: l.has_featured_deal,
      phone: l.phone_number,
      web_url: l.web_url || `https://weedmaps.com/dispensaries/${l.slug}`,
      avatar: l.avatar_image?.small_url,
      deals: (l.deals || []).map(d => ({
        title: d.title || d.name,
        description: d.description,
      })),
    }));

    return res.status(200).json({ dispensaries: listings, total: data?.meta?.total_listings });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
