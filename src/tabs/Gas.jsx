import { useState, useEffect } from "react";

const GRADE_LABELS = {
  regular:  { label: "Regular",  color: "#34c77b" },
  midgrade: { label: "Mid-Grade",color: "#ff9500" },
  premium:  { label: "Premium",  color: "#5b9fd4" },
  diesel:   { label: "Diesel",   color: "#ff9f0a" },
};

function Arrow({ current, prev }) {
  if (!prev || !current) return null;
  const diff = current - prev;
  if (Math.abs(diff) < 0.005) return <span style={{ color:"#555", fontSize:11 }}>—</span>;
  const up = diff > 0;
  return (
    <span style={{ color: up ? "#ff3b30" : "#34c77b", fontSize:11, fontWeight:700 }}>
      {up ? "▲" : "▼"} ${Math.abs(diff).toFixed(3)}
    </span>
  );
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const prices = data.map(d => d.price).filter(Boolean);
  if (prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 0.01;
  const w = 120, h = 36;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const last = prices[prices.length - 1];
  const lx = w;
  const ly = h - ((last - min) / range) * (h - 4) - 2;
  return (
    <svg width={w} height={h} style={{ overflow:"visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  );
}

export default function GasTab() {
  const [data,   setData]   = useState(null);
  const [status, setStatus] = useState("idle");

  const load = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/gas");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setStatus("live");
    } catch(e) {
      setStatus("error");
    }
  };

  useEffect(() => { load(); }, []);

  const cur = data?.current || {};
  const trend = data?.trend || {};
  const prevWeek = trend.regular?.[trend.regular.length - 2];
  const updatedStr = data?.updated
    ? new Date(data.updated).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })
    : null;

  // Compare to US avg
  const vsNational = cur.regular && cur.us_avg
    ? (cur.regular - cur.us_avg).toFixed(3)
    : null;

  return (
    <div>
      {/* Header */}
      <div style={{ background:"#090909", position:"sticky", top:0, zIndex:40, borderBottom:"1px solid #181818", padding:"20px 16px 14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:"-0.5px" }}>Gas Prices</div>
            <div style={{ fontSize:11, color:"#555", marginTop:3, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", display:"inline-block", background: status==="live"?"#34c77b":status==="loading"?"#ff9500":"#444" }} />
              {status==="live" ? `Central Atlantic region${updatedStr ? ` · ${updatedStr}` : ""}` : status==="loading" ? "Loading…" : "Failed"}
            </div>
          </div>
          <button onClick={load} disabled={status==="loading"} style={{ fontSize:10, fontWeight:700, padding:"5px 10px", borderRadius:7, border:"1px solid #1c1c1c", background:"#111", color:status==="loading"?"#2a2a2a":"#555", cursor:"pointer" }}>
            {status==="loading" ? "…" : "↺"}
          </button>
        </div>
      </div>

      {status==="loading" && (
        <div style={{ padding:"60px 20px", textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>⛽</div>
          <div style={{ color:"#555", fontSize:14 }}>Fetching EIA data…</div>
        </div>
      )}

      {status==="error" && (
        <div style={{ padding:"60px 20px", textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:10 }}>⚠️</div>
          <div style={{ color:"#555", fontSize:13, marginBottom:14 }}>Could not load gas prices</div>
          <div style={{ color:"#333", fontSize:11, marginBottom:14 }}>Add EIA_KEY to Vercel env vars for higher rate limits</div>
          <button onClick={load} style={{ padding:"7px 18px", borderRadius:8, background:"#1c1c1c", border:"1px solid #2a2a2a", color:"#aaa", cursor:"pointer", fontSize:12 }}>Try Again</button>
        </div>
      )}

      {status==="live" && data && (
        <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:10 }}>

          {/* Hero — Regular price */}
          <div style={{ background:"#111", borderRadius:14, padding:"20px 18px", border:"1px solid #181818" }}>
            <div style={{ fontSize:11, color:"#555", marginBottom:6, letterSpacing:.5 }}>REGULAR UNLEADED</div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:10, marginBottom:10 }}>
              <div style={{ fontSize:52, fontWeight:900, lineHeight:1, color:"#34c77b" }}>
                ${cur.regular?.toFixed(3)}
              </div>
              <div style={{ paddingBottom:6 }}>
                <Arrow current={cur.regular} prev={prevWeek?.price} />
                <div style={{ fontSize:10, color:"#444", marginTop:2 }}>vs last week</div>
              </div>
            </div>
            <Sparkline data={trend.regular} color="#34c77b" />
            <div style={{ fontSize:10, color:"#3a3a3a", marginTop:8 }}>6-week trend</div>
          </div>

          {/* vs National */}
          {vsNational !== null && (
            <div style={{ background:"#111", borderRadius:12, padding:"12px 16px", border:"1px solid #181818", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:11, color:"#555", letterSpacing:.5 }}>VS. NATIONAL AVG</div>
                <div style={{ fontSize:12, color:"#888", marginTop:2 }}>US avg: ${cur.us_avg?.toFixed(3)}</div>
              </div>
              <div style={{ fontSize:22, fontWeight:900, color: parseFloat(vsNational) > 0 ? "#ff3b30" : "#34c77b" }}>
                {parseFloat(vsNational) > 0 ? "+" : ""}{vsNational}
              </div>
            </div>
          )}

          {/* All grades */}
          <div style={{ background:"#111", borderRadius:14, padding:"14px 16px", border:"1px solid #181818" }}>
            <div style={{ fontSize:11, color:"#555", marginBottom:12, letterSpacing:.5 }}>ALL GRADES</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {Object.entries(GRADE_LABELS).map(([key, { label, color }]) => {
                const price = cur[key];
                if (!price) return null;
                return (
                  <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:3, height:20, borderRadius:2, background:color }} />
                      <span style={{ fontSize:13, color:"#888" }}>{label}</span>
                    </div>
                    <span style={{ fontSize:18, fontWeight:800, color:"#fff" }}>${price.toFixed(3)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trend chart — Regular vs US */}
          {trend.regular?.length > 1 && trend.us_avg?.length > 1 && (
            <div style={{ background:"#111", borderRadius:14, padding:"14px 16px", border:"1px solid #181818" }}>
              <div style={{ fontSize:11, color:"#555", marginBottom:14, letterSpacing:.5 }}>REGIONAL VS NATIONAL · 6 WEEKS</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {trend.regular.map((item, i) => {
                  const usItem = trend.us_avg[i];
                  const diff = usItem ? (item.price - usItem.price) : 0;
                  const dateStr = new Date(item.date + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" });
                  return (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:i<trend.regular.length-1?"1px solid #181818":"none" }}>
                      <span style={{ fontSize:11, color:"#444" }}>{dateStr}</span>
                      <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                        <span style={{ fontSize:12, color:"#34c77b", fontWeight:700 }}>${item.price?.toFixed(3)}</span>
                        {usItem && <span style={{ fontSize:11, color:"#3a3a3a" }}>US ${usItem.price?.toFixed(3)}</span>}
                        <span style={{ fontSize:10, color: diff > 0 ? "#ff3b30" : "#34c77b" }}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ textAlign:"center", fontSize:10, color:"#2a2a2a", padding:"4px 0 8px" }}>
            Source: US Energy Information Administration · Updated weekly
          </div>
        </div>
      )}
    </div>
  );
}
