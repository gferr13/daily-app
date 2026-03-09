import { useState, useEffect } from "react";

function WazeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C7 2 3 6.5 3 11c0 2.8 1.3 5.2 3.3 6.8L6 21l3.5-1.2c.8.2 1.6.3 2.5.3 5 0 9-4.5 9-9S17 2 12 2z" fill="#33CCFF" stroke="#00AACC" strokeWidth="1"/>
      <circle cx="9" cy="11" r="1.5" fill="#333"/>
      <circle cx="15" cy="11" r="1.5" fill="#333"/>
      <path d="M9 14.5c.8 1 1.4 1.5 3 1.5s2.2-.5 3-1.5" stroke="#333" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

export default function GasTab() {
  const [stations, setStations] = useState([]);
  const [regionPrice, setRegionPrice] = useState(null);
  const [status, setStatus] = useState("idle");
  const [coords, setCoords] = useState(null);

  const load = (lat, lng) => {
    setStatus("loading");
    const url = lat && lng ? `/api/gas?lat=${lat}&lng=${lng}` : "/api/gas";
    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setStations(json.stations || []);
        setRegionPrice(json.current?.regular || null);
        setStatus("live");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        load(lat, lng);
      },
      () => load(40.8126, -74.1854),
      { timeout: 6000 }
    );
  }, []);

  const openWaze = (station) => {
    const lat = station.lat || station.geometry?.location?.lat;
    const lng = station.lng || station.geometry?.location?.lng;
    if (lat && lng) {
      window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, "_blank");
    } else if (station.address) {
      const query = encodeURIComponent(station.address);
      window.open(`https://waze.com/ul?q=${query}&navigate=yes`, "_blank");
    }
  };

  return (
    <div>
      <div style={{ background: "#090909", position: "sticky", top: 0, zIndex: 40, borderBottom: "1px solid #181818", padding: "18px 16px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px" }}>Gas</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", display: "inline-block", background: status === "live" ? "#34c77b" : status === "loading" ? "#ff9500" : "#444" }} />
              {status === "live"
                ? `${stations.length} stations nearby${regionPrice ? ` · NJ avg $${regionPrice.toFixed(3)}` : ""}`
                : status === "loading" ? "Finding stations…" : "Could not load"}
            </div>
          </div>
          <button onClick={() => load(coords?.lat, coords?.lng)} disabled={status === "loading"} style={{ fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 7, border: "1px solid #1c1c1c", background: "#111", color: "#555", cursor: "pointer" }}>
            {status === "loading" ? "…" : "↺"}
          </button>
        </div>
      </div>

      {status === "loading" && (
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>⛽</div>
          <div style={{ color: "#555", fontSize: 14 }}>Finding stations near you…</div>
        </div>
      )}

      {status === "error" && (
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
          <div style={{ color: "#555", fontSize: 13, marginBottom: 14 }}>Could not load stations</div>
          <button onClick={() => load(coords?.lat, coords?.lng)} style={{ padding: "7px 18px", borderRadius: 8, background: "#1c1c1c", border: "1px solid #2a2a2a", color: "#aaa", cursor: "pointer", fontSize: 12 }}>Try Again</button>
        </div>
      )}

      {status === "live" && stations.length === 0 && (
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
          <div style={{ color: "#555", fontSize: 13 }}>No stations found nearby.<br />Allow location access and reload.</div>
        </div>
      )}

      {status === "live" && stations.length > 0 && (
        <div style={{ padding: "12px 16px 80px", display: "flex", flexDirection: "column", gap: 10 }}>

          {regionPrice && (
            <div style={{ background: "#111", borderRadius: 12, padding: "12px 16px", border: "1px solid #181818", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
              <div>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: 0.5 }}>NJ AREA AVG · REGULAR</div>
                <div style={{ fontSize: 11, color: "#333", marginTop: 2 }}>Source: US Energy Info Admin</div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#34c77b" }}>${regionPrice.toFixed(3)}</div>
            </div>
          )}

          {stations.map((s, i) => (
            <button key={i} onClick={() => openWaze(s)} style={{ background: "#111", borderRadius: 14, padding: "14px 16px", border: "1px solid #181818", textAlign: "left", cursor: "pointer", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3, color: "#fff" }}>⛽ {s.name}</div>
                <div style={{ color: "#555", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.address}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                  {s.rating && <span style={{ fontSize: 12, color: "#f59e0b" }}>★ {s.rating}</span>}
                  {s.isOpen !== undefined && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: s.isOpen ? "#4ade80" : "#f87171", background: s.isOpen ? "#052e16" : "#2d0a0a", padding: "2px 7px", borderRadius: 20 }}>
                      {s.isOpen ? "Open" : "Closed"}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <div style={{ background: "#1a2a1a", border: "1px solid #2a3a2a", borderRadius: 10, padding: "7px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                  <WazeIcon />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#33CCFF" }}>Go</span>
                </div>
                {regionPrice && <div style={{ fontSize: 13, fontWeight: 800, color: "#34c77b" }}>${regionPrice.toFixed(3)}</div>}
              </div>
            </button>
          ))}

          <div style={{ textAlign: "center", fontSize: 10, color: "#2a2a2a", padding: "4px 0 8px" }}>
            Tap any station to open in Waze · Prices from EIA
          </div>
        </div>
      )}
    </div>
  );
}
