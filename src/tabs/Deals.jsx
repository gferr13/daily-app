import { useState, useEffect } from "react";

const STORES = [
  { id:"all",      short:"All",      label:"All Stores",     color:"#ffffff" },
  { id:"shoprite", short:"ShopRite", label:"ShopRite",       color:"#e31837" },
  { id:"stopshop", short:"S&S",      label:"Stop & Shop",    color:"#cc1f26" },
  { id:"stew",     short:"Stew's",   label:"Stew Leonard's", color:"#007a3d" },
  { id:"costco",   short:"Costco",   label:"Costco",         color:"#005daa" },
  { id:"whole",    short:"WFM",      label:"Whole Foods",    color:"#00674b" },
  { id:"trader",   short:"TJ's",     label:"Trader Joe's",   color:"#c8001e" },
];

const STORE_QUERIES = [
  { id:"shoprite", q:"ShopRite"       },
  { id:"stopshop", q:"Stop Shop"      },
  { id:"stew",     q:"Stew Leonard"   },
  { id:"costco",   q:"Costco"         },
  { id:"whole",    q:"Whole Foods"    },
  { id:"trader",   q:"Trader Joe"     },
];

const CATS = ["All","Meat & Fish","Produce","Dairy","Bakery","Frozen","Snacks","Beverages","Household","Deli"];
const BADGE_COLORS = { "HOT":"#ff3b30","BOGO":"#ff9500","INSTANT SAVINGS":"#5b9fd4","PRIME":"#4db899" };
const storeOf = id => STORES.find(s => s.id === id) || STORES[0];

function guessCategory(name="") {
  const n = name.toLowerCase();
  if (/chicken|beef|steak|salmon|shrimp|pork|turkey|fish|lobster|crab|sausage|bacon|tilapia|tuna/.test(n)) return "Meat & Fish";
  if (/apple|banana|berry|strawberry|blueberry|tomato|lettuce|spinach|avocado|onion|pepper|broccoli|salad|kale|mango|grape|peach|corn|potato/.test(n)) return "Produce";
  if (/milk|cheese|yogurt|butter|cream|egg|dairy|mozzarella|cheddar/.test(n)) return "Dairy";
  if (/bread|bagel|muffin|cake|cookie|pastry|roll|croissant/.test(n)) return "Bakery";
  if (/frozen|ice cream|pizza|waffle|nugget/.test(n)) return "Frozen";
  if (/chip|snack|cracker|pretzel|nut|almond|popcorn|granola/.test(n)) return "Snacks";
  if (/juice|soda|water|coffee|tea|drink|beer|wine/.test(n)) return "Beverages";
  if (/detergent|paper|towel|toilet|soap|shampoo|laundry/.test(n)) return "Household";
  if (/deli|ham|salami|bologna|cold cut/.test(n)) return "Deli";
  return "Other";
}

function mapItem(item, storeId, idx) {
  const sale = parseFloat(item.current_price || item.sale_price) || 0;
  const orig = parseFloat(item.original_price || item.was_price) || 0;
  if (!sale || !item.name) return null;
  const pct = orig > sale && orig > 0 ? Math.round((orig - sale) / orig * 100) : 0;
  const desc = (item.description || "").toLowerCase();
  let badge = null;
  if (pct >= 50) badge = "HOT";
  else if (/bogo|buy one get one/.test(desc)) badge = "BOGO";
  else if (storeId === "costco") badge = "INSTANT SAVINGS";
  else if (storeId === "whole" && /prime/.test(desc)) badge = "PRIME";
  return {
    id: `${storeId}-${idx}`, store: storeId,
    name: item.name, cat: guessCategory(item.name),
    orig: orig || sale, sale, unit: item.unit_of_size ? `/${item.unit_of_size}` : "",
    pct, badge,
    exp: item.valid_to ? new Date(item.valid_to).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "",
  };
}

async function fetchStore(storeId, query) {
  const res = await fetch(`/api/flipp?q=${encodeURIComponent(query)}&postal_code=07003`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return (data.items || []).map((item, i) => mapItem(item, storeId, i)).filter(Boolean).slice(0, 25);
}

export default function DealsTab() {
  const [activeStore, setActiveStore] = useState("all");
  const [activeCat,   setActiveCat]   = useState("All");
  const [sortBy,      setSortBy]      = useState("pct");
  const [search,      setSearch]      = useState("");
  const [weekView,    setWeekView]    = useState("current");
  const [deals,       setDeals]       = useState([]);
  const [status,      setStatus]      = useState("idle");
  const [storeStatus, setStoreStatus] = useState({});
  const [currentStore,setCurrentStore]= useState("");
  const [progress,    setProgress]    = useState(0);

  const loadDeals = async () => {
    setStatus("loading"); setDeals([]); setStoreStatus({}); setProgress(0);
    const all = [];
    for (let i = 0; i < STORE_QUERIES.length; i++) {
      const { id, q } = STORE_QUERIES[i];
      setCurrentStore(storeOf(id).label);
      setProgress(Math.round((i / STORE_QUERIES.length) * 100));
      setStoreStatus(prev => ({ ...prev, [id]: "loading" }));
      try {
        const items = await fetchStore(id, q);
        all.push(...items);
        setDeals([...all]);
        setStoreStatus(prev => ({ ...prev, [id]: items.length }));
      } catch(e) {
        setStoreStatus(prev => ({ ...prev, [id]: "error" }));
      }
    }
    setProgress(100); setCurrentStore("");
    setStatus(all.length > 0 ? "live" : "error");
  };

  useEffect(() => { loadDeals(); }, []);

  const filtered = deals
    .filter(d => activeStore === "all" || d.store === activeStore)
    .filter(d => activeCat  === "All"  || d.cat   === activeCat)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "pct" ? b.pct - a.pct : a.sale - b.sale);

  const totalSaved = filtered.reduce((s, d) => s + Math.max(0, d.orig - d.sale), 0);
  const counts = {};
  deals.forEach(d => { counts[d.store] = (counts[d.store] || 0) + 1; });
  const dotColor = { live:"#34c77b", loading:"#ff9500", error:"#ff3b30", idle:"#444" }[status];

  return (
    <div>
      {/* Header */}
      <div style={{ background:"#090909", position:"sticky", top:0, zIndex:40, borderBottom:"1px solid #181818" }}>
        <div style={{ padding:"20px 16px 10px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:22, fontWeight:900, letterSpacing:"-0.5px" }}>Deal Finder</div>
              <div style={{ fontSize:11, color:"#555", marginTop:3, display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", display:"inline-block", background:dotColor }} />
                {status==="live" ? `Live · ZIP 07003 · ${deals.length} deals`
                :status==="loading" ? `Fetching ${currentStore}…`
                :status==="error" ? "Failed" : "Ready"}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
              <div style={{ background:"#111", border:"1px solid #1a1a1a", borderRadius:10, padding:"8px 12px", textAlign:"right" }}>
                <div style={{ color:"#34c77b", fontWeight:900, fontSize:18 }}>${totalSaved.toFixed(0)}</div>
                <div style={{ fontSize:9, color:"#3a3a3a", letterSpacing:.5 }}>SAVINGS</div>
                <div style={{ fontSize:10, color:"#555" }}>{filtered.length} deals</div>
              </div>
              <button onClick={loadDeals} disabled={status==="loading"} style={{ fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:7, border:"1px solid #1c1c1c", background:"#111", color:status==="loading"?"#2a2a2a":"#555", cursor:status==="loading"?"not-allowed":"pointer" }}>
                {status==="loading" ? "…" : "↺"}
              </button>
            </div>
          </div>

          {status==="loading" && (
            <div style={{ marginTop:8, height:2, background:"#1a1a1a", borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${progress}%`, background:"#34c77b", transition:"width .4s" }} />
            </div>
          )}

          {/* Week toggle */}
          <div style={{ marginTop:10, display:"flex", background:"#111", borderRadius:9, padding:3, border:"1px solid #1c1c1c" }}>
            {[["current","This Week"],["next","Next Week"]].map(([id,label]) => (
              <button key={id} onClick={()=>setWeekView(id)} style={{
                flex:1, padding:"6px 0", borderRadius:7, border:"none", cursor:"pointer",
                background:weekView===id?"#1e1e1e":"transparent",
                color:weekView===id?"#fff":"#444", fontSize:12, fontWeight:700,
              }}>{label}</button>
            ))}
          </div>

          <div style={{ position:"relative", marginTop:10 }}>
            <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", opacity:.3, fontSize:12 }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items…"
              style={{ width:"100%", background:"#111", border:"1px solid #1c1c1c", borderRadius:9, padding:"8px 12px 8px 32px", color:"#fff", fontSize:13, outline:"none", boxSizing:"border-box" }} />
          </div>
        </div>

        {/* Store tabs */}
        <div style={{ display:"flex", gap:5, overflowX:"auto", padding:"0 16px 10px", scrollbarWidth:"none" }}>
          {STORES.map(s => {
            const on = activeStore === s.id;
            const ss = storeStatus[s.id];
            const cnt = s.id==="all" ? deals.length : (counts[s.id]||0);
            return (
              <button key={s.id} onClick={()=>setActiveStore(s.id)} style={{
                flexShrink:0, padding:"6px 10px", borderRadius:9, cursor:"pointer",
                border:`1px solid ${on?s.color+"55":"#181818"}`,
                background:on?s.color+"15":"#0f0f0f",
                display:"flex", flexDirection:"column", alignItems:"center", gap:1, minWidth:48,
              }}>
                <span style={{ fontSize:10, fontWeight:700, color:on?s.color:"#555" }}>{s.short}</span>
                <span style={{ fontSize:8, color:on?s.color+"77":"#2a2a2a" }}>{ss==="loading"?"…":ss==="error"?"✗":cnt}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:4, overflowX:"auto", padding:"0 16px 10px", scrollbarWidth:"none", alignItems:"center" }}>
          {[["pct","% Off"],["sale","$ Low"]].map(([k,l])=>(
            <button key={k} onClick={()=>setSortBy(k)} style={{
              flexShrink:0, padding:"3px 8px", borderRadius:5,
              border:`1px solid ${sortBy===k?"#34c77b44":"#1c1c1c"}`,
              background:sortBy===k?"#0d2218":"transparent",
              color:sortBy===k?"#34c77b":"#3a3a3a", fontSize:10, fontWeight:700, cursor:"pointer",
            }}>{l}</button>
          ))}
          <div style={{ width:1, height:11, background:"#222", flexShrink:0 }} />
          {CATS.map(c=>(
            <button key={c} onClick={()=>setActiveCat(c)} style={{
              flexShrink:0, padding:"3px 8px", borderRadius:5, border:"none",
              background:activeCat===c?"#1c1c1c":"transparent",
              color:activeCat===c?"#ddd":"#3a3a3a", fontSize:10, fontWeight:600, cursor:"pointer",
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* States */}
      {status==="loading" && deals.length===0 && (
        <div style={{ padding:"48px 20px", textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🛒</div>
          <div style={{ color:"#555", fontSize:14 }}>Pulling live circulars…</div>
          <div style={{ color:"#333", fontSize:12, marginTop:4 }}>{currentStore}</div>
        </div>
      )}
      {status==="error" && deals.length===0 && (
        <div style={{ padding:40, textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:10 }}>⚠️</div>
          <div style={{ color:"#555", fontSize:13, marginBottom:14 }}>Could not reach Flipp</div>
          <button onClick={loadDeals} style={{ padding:"7px 18px", borderRadius:8, background:"#1c1c1c", border:"1px solid #2a2a2a", color:"#aaa", cursor:"pointer", fontSize:12 }}>Try Again</button>
        </div>
      )}

      {/* Deals */}
      {deals.length>0 && (
        <div style={{ padding:"6px 12px", display:"flex", flexDirection:"column", gap:5 }}>
          {filtered.length===0 && <div style={{ textAlign:"center", padding:40, color:"#2a2a2a", fontSize:13 }}>No deals match</div>}
          {filtered.map(d => <DealCard key={d.id} deal={d} />)}
        </div>
      )}
    </div>
  );
}

function DealCard({ deal }) {
  const s = storeOf(deal.store);
  const saved = Math.max(0, deal.orig - deal.sale).toFixed(2);
  const bc = BADGE_COLORS[deal.badge] || "#555";
  return (
    <div style={{ background:"#111", borderRadius:11, padding:"11px 12px 11px 15px", display:"flex", alignItems:"center", gap:10, border:"1px solid #181818", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:s.color, borderRadius:"11px 0 0 11px" }} />
      <div style={{ flexShrink:0, width:48, height:48, borderRadius:"50%", background:"#0d2218", border:"1.5px solid #34c77b18", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        {deal.pct > 0 ? (<><div style={{ fontSize:14, fontWeight:900, color:"#34c77b", lineHeight:1 }}>{deal.pct}%</div><div style={{ fontSize:7, color:"#34c77b44" }}>OFF</div></>) : (<div style={{ fontSize:11, fontWeight:900, color:"#34c77b" }}>SALE</div>)}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, lineHeight:1.3, marginBottom:4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{deal.name}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:3, alignItems:"center" }}>
          <span style={{ fontSize:9, fontWeight:700, background:s.color+"18", color:s.color, padding:"2px 5px", borderRadius:4 }}>{s.short}</span>
          {deal.badge && <span style={{ fontSize:9, fontWeight:800, background:bc+"18", color:bc, padding:"2px 5px", borderRadius:4 }}>{deal.badge}</span>}
          {deal.exp && <span style={{ fontSize:9, color:"#333" }}>thru {deal.exp}</span>}
        </div>
        {deal.orig>deal.sale && <div style={{ fontSize:10, color:"#2a2a2a", marginTop:3 }}>save ${saved}</div>}
      </div>
      <div style={{ flexShrink:0, textAlign:"right" }}>
        <div style={{ fontSize:20, fontWeight:900, lineHeight:1 }}>${deal.sale}{deal.unit&&<span style={{ fontSize:10, fontWeight:400, color:"#555" }}>{deal.unit}</span>}</div>
        {deal.orig>deal.sale && <div style={{ fontSize:10, color:"#252525", textDecoration:"line-through", marginTop:1 }}>${deal.orig}</div>}
      </div>
    </div>
  );
}
