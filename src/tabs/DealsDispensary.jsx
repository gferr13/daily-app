import { useState, useEffect } from 'react';
import { isBusy } from '../utils/busyness';

const DISPENSARIES = [
  { name: 'A-Z Supply', slug: 'a-z-supply', address: 'Bloomfield, NJ', emoji: '🅰️', weedmaps: true },
  { name: 'Emerald Tea Supply Co.', slug: 'emerald-tea-supply-company', address: 'Bloomfield, NJ', emoji: '🍵', weedmaps: true },
  { name: 'Blue Oak', slug: 'blue-oak', address: 'Bloomfield, NJ', emoji: '🌳', weedmaps: true },
  { name: 'Rise Bloomfield', slug: null, address: '400 Bloomfield Ave, Bloomfield, NJ', emoji: '☀️', weedmaps: false, url: 'https://risecannabisnj.com/stores/bloomfield/' },
];

const busy = isBusy('dispensary');

export default function DealsDispensary({ onBack }) {
  const [selected, setSelected] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);

  async function loadDeals(disp) {
    setSelected(disp);
    if (!disp.weedmaps) return;
    setLoading(true);
    setDeals([]);
    setStoreInfo(null);
    try {
      const r = await fetch(`/api/weedmaps?slug=${disp.slug}`);
      const data = await r.json();
      const listing = data?.data?.listing || data?.listing || null;
      if (listing) {
        setStoreInfo({
          name: listing.name,
          rating: listing.rating,
          reviews: listing.reviews_count,
          open: listing.open_now,
          hours: listing.todays_hours_str,
          phone: listing.phone,
          url: listing.web_url || `https://weedmaps.com/dispensaries/${disp.slug}`,
          avatar: listing.avatar_image?.small_url,
        });
        setDeals(listing.deals || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // Store list view
  if (!selected) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #1a1a1a' }}>
          <button onClick={onBack} style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>🌿 Dispensaries</span>
        </div>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DISPENSARIES.map(d => (
            <div key={d.name} onClick={() => loadDeals(d)}
              style={{ background: '#111', borderRadius: 14, padding: '14px 16px', border: '1px solid #1c1c1c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28 }}>{d.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{d.name}</div>
                <div style={{ color: '#555', fontSize: 12 }}>{d.address}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {busy && <span style={{ background: '#ff3b3b', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 6px' }}>Busy</span>}
                {!d.weedmaps && <span style={{ color: '#555', fontSize: 11 }}>Direct ↗</span>}
                <span style={{ color: '#444', fontSize: 18 }}>›</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Rise — no Weedmaps, just direct link
  if (selected && !selected.weedmaps) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #1a1a1a' }}>
          <button onClick={() => setSelected(null)} style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{selected.emoji} {selected.name}</span>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#111', borderRadius: 14, padding: 20, border: '1px solid #1c1c1c', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>☀️</div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{selected.name}</div>
            <div style={{ color: '#555', fontSize: 13, marginBottom: 4 }}>{selected.address}</div>
            <div style={{ color: '#555', fontSize: 12, marginBottom: 20 }}>Rise uses their own ordering platform</div>
            <a href={selected.url} target="_blank" rel="noreferrer"
              style={{ display: 'block', background: '#1a3a1a', border: '1px solid #2a5a2a', color: '#4caf50', borderRadius: 10, padding: '12px 20px', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
              View Deals & Menu →
            </a>
            <a href={`https://maps.apple.com/?q=${encodeURIComponent(selected.address)}`} target="_blank" rel="noreferrer"
              style={{ display: 'block', background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 10, padding: '10px 20px', textDecoration: 'none', fontSize: 13 }}>
              📍 Get Directions
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Weedmaps dispensary deals view
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #1a1a1a' }}>
        <button onClick={() => { setSelected(null); setDeals([]); setStoreInfo(null); }}
          style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{selected.emoji} {selected.name}</span>
      </div>

      {loading && <div style={{ padding: 40, textAlign: 'center', color: '#444' }}>Loading deals...</div>}

      {!loading && storeInfo && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Store header */}
          <div style={{ background: '#111', borderRadius: 14, padding: 16, border: '1px solid #1c1c1c', display: 'flex', gap: 12, alignItems: 'center' }}>
            {storeInfo.avatar && <img src={storeInfo.avatar} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{storeInfo.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {storeInfo.rating > 0 && <span style={{ color: '#f5a623', fontSize: 12 }}>★ {storeInfo.rating?.toFixed(1)}</span>}
                {storeInfo.reviews > 0 && <span style={{ color: '#555', fontSize: 12 }}>{storeInfo.reviews} reviews</span>}
                {busy && <span style={{ background: '#ff3b3b', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 6px' }}>Busy</span>}
              </div>
              <div style={{ color: storeInfo.open ? '#4caf50' : '#888', fontSize: 12, marginTop: 3 }}>
                {storeInfo.open ? '● Open' : '○ Closed'}{storeInfo.hours ? ' · ' + storeInfo.hours : ''}
              </div>
            </div>
          </div>

          {/* Deals */}
          {deals.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: '#333', fontSize: 13 }}>No active deals right now</div>
          )}
          {deals.map((deal, i) => (
            <div key={i} style={{ background: '#111', borderRadius: 14, padding: 16, border: '1px solid #1c3b1c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, flex: 1, paddingRight: 8 }}>{deal.title || deal.name}</div>
                {deal.deal_type && (
                  <span style={{ background: '#1a3a1a', color: '#4caf50', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 7px', whiteSpace: 'nowrap' }}>
                    {deal.deal_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                )}
              </div>
              {deal.description && <div style={{ color: '#666', fontSize: 12, lineHeight: 1.5 }}>{deal.description}</div>}
              {deal.expires_at && (
                <div style={{ color: '#444', fontSize: 11, marginTop: 6 }}>
                  Expires {new Date(deal.expires_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}

          {/* CTA */}
          <a href={storeInfo.url} target="_blank" rel="noreferrer"
            style={{ display: 'block', background: '#1a3a1a', border: '1px solid #2a5a2a', color: '#4caf50', borderRadius: 12, padding: '13px 20px', textDecoration: 'none', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>
            View Full Menu on Weedmaps →
          </a>
        </div>
      )}

      {!loading && !storeInfo && (
        <div style={{ padding: 40, textAlign: 'center', color: '#444', fontSize: 13 }}>Could not load store data</div>
      )}
    </div>
  );
}
