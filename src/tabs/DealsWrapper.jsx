import { useState } from "react";
import SupermarketDeals from "./Deals.jsx";
import DispensaryDeals from "./DealsDispensary.jsx";

const CATEGORIES = [
  { id: "supermarket", label: "Supermarkets",  icon: "🛒", color: "#1a2e1a", border: "#2a3e2a", available: true },
  { id: "dispensary",  label: "Dispensaries",  icon: "🌿", color: "#1a2a1a", border: "#2a3a2a", available: true },
  { id: "pharmacy",    label: "Pharmacy",      icon: "💊", color: "#1a1a2e", border: "#2a2a3e", available: false },
  { id: "liquor",      label: "Liquor & Beer", icon: "🍺", color: "#2a1a1a", border: "#3a2a2a", available: false },
  { id: "pet",         label: "Pet Supplies",  icon: "🐾", color: "#2a2a1a", border: "#3a3a2a", available: false },
  { id: "home",        label: "Home & Hardware",icon: "🔧", color: "#1a2a2a", border: "#2a3a3a", available: false },
];

export default function DealsTab() {
  const [active, setActive] = useState(null);

  if (active) {
    const cat = CATEGORIES.find(c => c.id === active);
    // Dispensary has its own header, skip the wrapper header
    if (active === "dispensary") {
      return <DispensaryDeals onBack={() => setActive(null)} />;
    }
    return (
      <div>
        {/* Back header */}
        <div style={{ background: "#090909", position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid #181818", padding: "14px 16px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setActive(null)} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            ← Back
          </button>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{cat.icon} {cat.label}</div>
        </div>
        {active === "supermarket" && <SupermarketDeals hideHeader />}
        {active === "dispensary"  && <DispensaryDeals onBack={() => setActive(null)} hideHeader />}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: "#090909", position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid #181818", padding: "18px 16px 14px" }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px" }}>Deals</div>
        <div style={{ fontSize: 12, color: "#444", marginTop: 3 }}>What are you shopping for?</div>
      </div>

      {/* Grid */}
      <div style={{ padding: "16px 16px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => cat.available && setActive(cat.id)}
              style={{
                background: cat.available ? cat.color : "#0e0e0e",
                border: `1px solid ${cat.available ? cat.border : "#181818"}`,
                borderRadius: 16,
                padding: "22px 16px",
                textAlign: "left",
                cursor: cat.available ? "pointer" : "default",
                opacity: cat.available ? 1 : 0.4,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minHeight: 100,
              }}
            >
              <div style={{ fontSize: 32 }}>{cat.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: cat.available ? "#fff" : "#444", lineHeight: 1.2 }}>{cat.label}</div>
              {!cat.available && <div style={{ fontSize: 10, color: "#333", fontWeight: 600 }}>COMING SOON</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
