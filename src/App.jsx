import { useState } from "react";
import DealsTab  from "./tabs/DealsWrapper.jsx";
import GasTab    from "./tabs/Gas.jsx";
import EventsTab from "./tabs/Events.jsx";
import EatsTab   from "./tabs/Eats.jsx";

const TABS = [
  { id: "deals",  label: "Deals",  icon: "🛒" },
  { id: "gas",    label: "Gas",    icon: "⛽" },
  { id: "events", label: "Events", icon: "📍" },
  { id: "eats",   label: "Around Me",   icon: "🍽" },
];

export default function App() {
  const [tab, setTab] = useState("deals");

  return (
    <div style={{ fontFamily:"'DM Sans','Helvetica Neue',sans-serif", background:"#090909", minHeight:"100vh", color:"#fff", maxWidth:430, margin:"0 auto", paddingBottom:70 }}>

      {/* Active tab */}
      <div style={{ display: tab==="deals"  ? "block" : "none" }}><DealsTab  /></div>
      <div style={{ display: tab==="gas"    ? "block" : "none" }}><GasTab    /></div>
      <div style={{ display: tab==="events" ? "block" : "none" }}><EventsTab /></div>
      <div style={{ display: tab==="eats"   ? "block" : "none" }}><EatsTab   /></div>

      {/* Bottom nav */}
      <div style={{
        position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:430,
        background:"#0f0f0f", borderTop:"1px solid #1c1c1c",
        display:"flex", zIndex:100,
        paddingBottom:"env(safe-area-inset-bottom)",
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:"10px 0 8px", border:"none", background:"transparent",
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              cursor:"pointer",
            }}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:.3, color: active?"#34c77b":"#444" }}>
                {t.label.toUpperCase()}
              </span>
              {active && <div style={{ width:16, height:2, borderRadius:1, background:"#34c77b" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
