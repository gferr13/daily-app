import { useState, useEffect } from "react";

export default function DealsDispensary() {
  const [dispensaries, setDispensaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        fetchDeals(lat, lng);
      },
      () => fetchDeals(40.8126, -74.1854),
      { timeout: 6000 }
    );
  }, []);

  const fetchDeals = async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/weedmaps?lat=${lat}&lng=${lng}`);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setDispensaries(data.dispensaries || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🌿</div>
      Finding dispensary deals nearby...
    </div>
  );

  if (error) return (
    <div style={{ padding: 24 }}>
      <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: "#888", fontSize: 14, marginBottom: 8 }}>Couldn't load Weedmaps deals</div>
        <div style={{ color: "#555", fontSize: 12, marginBottom: 16 }}>{error}</div>
        <a href="https://weedmaps.com/dispensaries/in/new-jersey/essex-county" target="_blank" rel="noreferrer"
          style={{ background: "#2a2a2a", color: "#34c77b", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
          View on Weedmaps →
        </a>
      </div>
    </div>
  );

  if (!loading && dispensaries.length === 0) return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🌿</div>
      <div style={{ color: "#888", fontSize: 15, marginBottom: 8 }}>No active deals found nearby</div>
      <a href="https://weedmaps.com/dispensaries/in/new-jersey" target="_blank" rel="noreferrer"
        style={{ color: "#34c77b", fontSize: 13 }}>Browse on Weedmaps →</a>
    </div>
  );

  return (
    <div style={{ padding: "8px 16px 80px" }}>
      <div style={{ color: "#555", fontSize: 12, marginBottom: 14 }}>
        {dispensaries.length} dispensaries with active deals near you
      </div>
      {dispensaries.map((d, i) => (
        <div key={d.id || i} style={{ background: "#1e1e1e", borderRadius: 12, marginBottom: 10, border: "1px solid #2a2a2a", overflow: "hidden" }}>
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{ width: "100%", background: "transparent", border: "none", padding: "14px 16px", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 2 }}>🌿 {d.name}</div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {d.city}{d.distance ? ` · ${d.distance.toFixed(1)} mi` : ""}
                {d.rating ? ` · ★ ${d.rating}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "#1a3a1a", color: "#4ade80", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>
                {d.deals.length} deal{d.deals.length !== 1 ? "s" : ""}
              </span>
              <span style={{ color: "#555", fontSize: 16 }}>{expanded === i ? "▲" : "▼"}</span>
            </div>
          </button>

          {expanded === i && (
            <div style={{ borderTop: "1px solid #2a2a2a", padding: "12px 16px" }}>
              {d.deals.map((deal, j) => (
                <div key={j} style={{ padding: "10px 12px", background: "#111", borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#fff", marginBottom: deal.description ? 4 : 0 }}>{deal.title}</div>
                  {deal.description && <div style={{ fontSize: 12, color: "#777" }}>{deal.description}</div>}
                  {deal.discount && <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700, marginTop: 4 }}>{deal.discount}</div>}
                </div>
              ))}
              <a href={d.url} target="_blank" rel="noreferrer"
                style={{ display: "block", textAlign: "center", color: "#34c77b", fontSize: 12, marginTop: 8, padding: "8px", background: "#0d1f0d", borderRadius: 8, textDecoration: "none" }}>
                View full menu on Weedmaps →
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
