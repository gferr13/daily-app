import { useState, useEffect } from "react";

export default function DealsDispensary() {
  const [dispensaries, setDispensaries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [coords, setCoords] = useState(null);

  const fetchDispensaries = async (lat, lng) => {
    setStatus("loading");
    try {
      // Call Weedmaps discovery API directly from browser (no server proxy)
      const url = `https://api-g.weedmaps.com/discovery/v1/listings?filter[any_retailer_services][]=storefront&filter[latlng]=${lat},${lng}&filter[distance]=15&size=15&include[]=deals`;
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "Referer": "https://weedmaps.com/",
        },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const listings = (data?.data?.listings || []).map(l => ({
        id: l.id,
        name: l.name,
        city: l.city,
        distance: l.distance,
        rating: l.rating,
        slug: l.slug,
        address: l.address,
        phone: l.phone_number,
        url: `https://weedmaps.com/dispensaries/${l.slug}`,
        deals: (l.deals || []).map(d => ({
          title: d.title || d.name,
          description: d.description,
        })),
      }));
      setDispensaries(listings);
      setStatus("live");
    } catch (e) {
      console.error("Weedmaps error:", e);
      setStatus("error");
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        fetchDispensaries(lat, lng);
      },
      () => {
        setCoords({ lat: 40.8126, lng: -74.1854 });
        fetchDispensaries(40.8126, -74.1854);
      },
      { timeout: 6000 }
    );
  }, []);

  const weedmapsUrl = coords
    ? `https://weedmaps.com/dispensaries?lat=${coords.lat}&lng=${coords.lng}`
    : `https://weedmaps.com/dispensaries/in/united-states/new-jersey/bloomfield`;

  if (status === "loading") {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>🌿</div>
        <div style={{ color: "#555", fontSize: 14 }}>Finding dispensaries near you…</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ padding: "24px 16px 80px" }}>
        <div style={{ background: "#0d1f0d", border: "1px solid #1a3a1a", borderRadius: 18, padding: "28px 20px", textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🌿</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Find Dispensary Deals</div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.6 }}>
            Browse live menus, daily deals, and specials near you on Weedmaps.
          </div>
          <a href={weedmapsUrl} target="_blank" rel="noreferrer"
            style={{ display: "block", background: "#1a4d1a", border: "1px solid #2a6a2a", borderRadius: 14, padding: "14px 20px", textDecoration: "none", color: "#fff", fontSize: 15, fontWeight: 700 }}>
            Browse on Weedmaps →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #181818" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: "#555", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34c77b", display: "inline-block" }} />
              {dispensaries.length} dispensaries nearby
            </div>
          </div>
          <a href={weedmapsUrl} target="_blank" rel="noreferrer"
            style={{ fontSize: 11, fontWeight: 700, color: "#34c77b", textDecoration: "none", background: "#052e16", padding: "5px 10px", borderRadius: 8, border: "1px solid #14532d" }}>
            View All →
          </a>
        </div>
      </div>

      <div style={{ padding: "10px 16px" }}>
        {dispensaries.length === 0 && (
          <div style={{ textAlign: "center", color: "#555", padding: "48px 0" }}>
            No dispensaries found nearby.
          </div>
        )}
        {dispensaries.map((d, i) => (
          <a key={d.id || i} href={d.url} target="_blank" rel="noreferrer"
            style={{ display: "block", background: "#111", borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: "1px solid #181818", textDecoration: "none", color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>🌿 {d.name}</div>
                {d.address && <div style={{ color: "#555", fontSize: 12, marginBottom: 4 }}>{d.address}</div>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  {d.distance && <span style={{ fontSize: 12, color: "#888" }}>📍 {typeof d.distance === 'number' ? d.distance.toFixed(1) : d.distance} mi</span>}
                  {d.rating && <span style={{ fontSize: 12, color: "#f59e0b" }}>★ {d.rating}</span>}
                  {d.deals?.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#34c77b", background: "#052e16", padding: "2px 7px", borderRadius: 20 }}>
                      {d.deals.length} deal{d.deals.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {d.deals?.slice(0, 2).map((deal, j) => (
                  <div key={j} style={{ marginTop: 8, background: "#0d1f0d", border: "1px solid #1a3a1a", borderRadius: 8, padding: "6px 10px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#86efac" }}>{deal.title}</div>
                    {deal.description && <div style={{ fontSize: 11, color: "#555", marginTop: 2, lineHeight: 1.4 }}>{deal.description.slice(0, 80)}{deal.description.length > 80 ? "…" : ""}</div>}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#34c77b", flexShrink: 0, marginLeft: 10, marginTop: 2 }}>Menu →</div>
            </div>
          </a>
        ))}
        <div style={{ textAlign: "center", fontSize: 10, color: "#2a2a2a", marginTop: 4 }}>
          Data from Weedmaps · Tap any card to view full menu
        </div>
      </div>
    </div>
  );
}
