import { useState, useEffect } from "react";

const CATEGORY_META = {
  "concerts":           { label:"Concerts",       icon:"🎵", color:"#ff375f" },
  "festivals":          { label:"Festivals",      icon:"🎪", color:"#ff9500" },
  "sports":             { label:"Sports",         icon:"🏟",  color:"#30d158" },
  "community":          { label:"Community",      icon:"🤝", color:"#64d2ff" },
  "performing-arts":    { label:"Arts",           icon:"🎭", color:"#bf5af2" },
  "food-drink-festivals":{ label:"Food & Drink",  icon:"🍺", color:"#ff9f0a" },
  "expos":              { label:"Expos",          icon:"🏛",  color:"#5e5ce6" },
  "conferences":        { label:"Conferences",    icon:"💼", color:"#636366" },
};

const ALL_CATS = ["All", ...Object.keys(CATEGORY_META)];

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours(), m = d.getMinutes();
  if (h === 0 && m === 0) return "";
  return d.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });
}

function getRankLabel(rank) {
  if (rank >= 90) return { label:"Major", color:"#ff375f" };
  if (rank >= 70) return { label:"Large",  color:"#ff9500" };
  if (rank >= 50) return { label:"Mid",    color:"#34c77b" };
  return null;
}

export default function EventsTab() {
  const [events,   setEvents]   = useState([]);
  const [status,   setStatus]   = useState("idle");
  const [activeCat,setActiveCat]= useState("All");
  const [search,   setSearch]   = useState("");
  const [keyError, setKeyError] = useState(false);

  const load = async () => {
    setStatus("loading");
    setKeyError(false);
    try {
      const res = await fetch("/api/events?days=30");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error?.includes("not configured")) {
        setKeyError(true);
        setStatus("error");
        return;
      }
      if (data.error) throw new Error(data.error);
      setEvents(data.events || []);
      setStatus("live");
    } catch(e) {
      setStatus("error");
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = events
    .filter(e => activeCat === "All" || e.category === activeCat)
    .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.entities || []).some(en => en.name?.toLowerCase().includes(search.toLowerCase())));

  // Group by date
  const grouped = {};
  filtered.forEach(e => {
    const dateKey = formatDate(e.start);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(e);
  });

  return (
    <div>
      {/* Header */}
      <div style={{ background:"#090909", position:"sticky", top:0, zIndex:40, borderBottom:"1px solid #181818", padding:"20px 16px 10px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:"-0.5px" }}>Events</div>
            <div style={{ fontSize:11, color:"#555", marginTop:3, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", display:"inline-block", background:status==="live"?"#34c77b":status==="loading"?"#ff9500":"#444" }} />
              {status==="live" ? `${events.length} events near Bloomfield NJ`
              :status==="loading" ? "Searching events…"
              : "Needs PredictHQ key"}
            </div>
          </div>
          <button onClick={load} disabled={status==="loading"} style={{ fontSize:10, fontWeight:700, padding:"5px 10px", borderRadius:7, border:"1px solid #1c1c1c", background:"#111", color:status==="loading"?"#2a2a2a":"#555", cursor:"pointer" }}>
            {status==="loading" ? "…" : "↺"}
          </button>
        </div>

        {/* Category pills */}
        <div style={{ display:"flex", gap:5, overflowX:"auto", marginTop:10, scrollbarWidth:"none", paddingBottom:4 }}>
          {ALL_CATS.map(c => {
            const meta = CATEGORY_META[c];
            const on = activeCat === c;
            return (
              <button key={c} onClick={()=>setActiveCat(c)} style={{
                flexShrink:0, padding:"5px 11px", borderRadius:20, cursor:"pointer",
                border:`1px solid ${on?(meta?.color||"#fff")+"55":"#1c1c1c"}`,
                background:on?(meta?.color||"#fff")+"15":"#0f0f0f",
                color:on?(meta?.color||"#fff"):"#444",
                fontSize:11, fontWeight:700, display:"flex", alignItems:"center", gap:4,
              }}>
                {meta?.icon && <span>{meta.icon}</span>}
                {meta?.label || "All"}
              </button>
            );
          })}
        </div>

        <div style={{ position:"relative", marginTop:10 }}>
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", opacity:.3, fontSize:12 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events, venues…"
            style={{ width:"100%", background:"#111", border:"1px solid #1c1c1c", borderRadius:9, padding:"8px 12px 8px 32px", color:"#fff", fontSize:13, outline:"none", boxSizing:"border-box" }} />
        </div>
      </div>

      {/* Loading */}
      {status==="loading" && (
        <div style={{ padding:"60px 20px", textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>📍</div>
          <div style={{ color:"#555", fontSize:14 }}>Finding events near you…</div>
        </div>
      )}

      {/* Key error */}
      {status==="error" && keyError && (
        <div style={{ padding:"32px 20px" }}>
          <div style={{ background:"#111", borderRadius:14, padding:"20px", border:"1px solid #1c1c1c" }}>
            <div style={{ fontSize:28, marginBottom:10 }}>🔑</div>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>PredictHQ Key Needed</div>
            <div style={{ fontSize:12, color:"#555", lineHeight:1.6, marginBottom:14 }}>
              Add your PredictHQ API key to Vercel environment variables to enable events.
            </div>
            <div style={{ background:"#0f0f0f", borderRadius:8, padding:"10px 12px", fontFamily:"monospace", fontSize:11, color:"#34c77b", border:"1px solid #1c1c1c" }}>
              PREDICTHQ_KEY=your_key_here
            </div>
            <div style={{ fontSize:11, color:"#444", marginTop:10 }}>
              In Vercel: Project → Settings → Environment Variables
            </div>
          </div>
        </div>
      )}

      {/* Generic error */}
      {status==="error" && !keyError && (
        <div style={{ padding:40, textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:10 }}>⚠️</div>
          <div style={{ color:"#555", fontSize:13, marginBottom:14 }}>Could not load events</div>
          <button onClick={load} style={{ padding:"7px 18px", borderRadius:8, background:"#1c1c1c", border:"1px solid #2a2a2a", color:"#aaa", cursor:"pointer", fontSize:12 }}>Try Again</button>
        </div>
      )}

      {/* Events grouped by date */}
      {status==="live" && (
        <div style={{ padding:"8px 12px", display:"flex", flexDirection:"column", gap:16 }}>
          {Object.keys(grouped).length === 0 && (
            <div style={{ textAlign:"center", padding:48, color:"#2a2a2a", fontSize:13 }}>No events match</div>
          )}
          {Object.entries(grouped).map(([date, evts]) => (
            <div key={date}>
              <div style={{ fontSize:11, fontWeight:700, color:"#444", letterSpacing:.8, marginBottom:6, paddingLeft:2 }}>
                {date.toUpperCase()}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {evts.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            </div>
          ))}
          <div style={{ textAlign:"center", fontSize:10, color:"#2a2a2a", padding:"4px 0 8px" }}>
            Powered by PredictHQ · 30mi radius from Bloomfield NJ
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event }) {
  const meta = CATEGORY_META[event.category] || { label: event.category, icon:"📌", color:"#555" };
  const rankLabel = getRankLabel(event.rank);
  const venue = event.entities?.find(e => e.type === "venue");
  const timeStr = formatTime(event.start);
  const attendance = event.phq_attendance ? `~${event.phq_attendance.toLocaleString()} expected` : null;

  return (
    <div style={{ background:"#111", borderRadius:11, padding:"12px 14px", border:"1px solid #181818", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:meta.color, borderRadius:"11px 0 0 11px" }} />

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, lineHeight:1.35, marginBottom:5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
            {event.title}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, alignItems:"center" }}>
            <span style={{ fontSize:9, fontWeight:700, background:meta.color+"18", color:meta.color, padding:"2px 6px", borderRadius:4 }}>
              {meta.icon} {meta.label}
            </span>
            {rankLabel && (
              <span style={{ fontSize:9, fontWeight:800, background:rankLabel.color+"18", color:rankLabel.color, padding:"2px 6px", borderRadius:4 }}>
                {rankLabel.label}
              </span>
            )}
            {timeStr && <span style={{ fontSize:9, color:"#555" }}>{timeStr}</span>}
          </div>
        </div>
      </div>

      {(venue || attendance) && (
        <div style={{ marginTop:7, paddingTop:7, borderTop:"1px solid #1a1a1a" }}>
          {venue && (
            <div style={{ fontSize:11, color:"#555", marginBottom:2 }}>
              📍 {venue.name}{venue.address ? ` · ${venue.address.split(",").slice(0,2).join(",")}` : ""}
            </div>
          )}
          {attendance && (
            <div style={{ fontSize:10, color:"#3a3a3a" }}>{attendance}</div>
          )}
        </div>
      )}
    </div>
  );
}
