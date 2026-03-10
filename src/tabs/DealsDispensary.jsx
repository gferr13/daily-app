import { useState, useEffect } from 'react';
import { isBusy } from '../utils/busyness';

const busy = isBusy('dispensary');

export default function DealsDispensary({ onBack }) {
  const [stores, setStores] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dispensary-deals')
      .then(r => r.json())
      .then(data => { setStores(data.stores || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!selected) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, background: '#090909', zIndex: 10 }}>
          <button onClick={onBack} style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>🌿 Dispensary Deals</span>
        </div>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: '#444', fontSize: 13 }}>Loading deals...</div>}
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stores.map(store => (
            <div key={store.id} onClick={() => setSelected(store)}
              style={{ background: '#111', borderRadius: 14, padding: '14px 16px', border: '1px solid #1c1c1c', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 26 }}>{store.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{store.name}</div>
                  <div style={{ color: '#555', fontSize: 12 }}>
                    {store.deals.length > 0 ? store.deals.length + ' deal' + (store.deals.length > 1 ? 's' : '') + ' active' : 'No active deals'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {busy && <span style={{ background: '#ff3b3b', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 6px' }}>Busy</span>}
                  {store.deals.length > 0 && <span style={{ background: '#1a3a1a', color: '#4caf50', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 7px' }}>DEALS</span>}
                  <span style={{ color: '#444', fontSize: 18 }}>›</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, background: '#090909', zIndex: 10 }}>
        <button onClick={() => setSelected(null)} style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{selected.emoji} {selected.name}</span>
        {busy && <span style={{ background: '#ff3b3b', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 6px' }}>Busy</span>}
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {selected.deals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#333', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🌿</div>
            <div>No active deals right now</div>
            <div style={{ color: '#2a2a2a', fontSize: 11, marginTop: 6 }}>Refreshes every 3 hours</div>
          </div>
        )}
        {selected.deals.map((deal, i) => (
          <div key={i} style={{ background: '#111', borderRadius: 14, padding: 16, border: '1px solid #1c3b1c' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                {deal.brand && <div style={{ color: '#555', fontSize: 11, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{deal.brand}</div>}
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: deal.description ? 6 : 0 }}>{deal.title}</div>
                {deal.description && <div style={{ color: '#4caf50', fontSize: 13, fontWeight: 600 }}>{deal.description}</div>}
              </div>
              {deal.image && <img src={deal.image} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />}
            </div>
          </div>
        ))}
        <a href={selected.menuUrl} target="_blank" rel="noreferrer"
          style={{ display: 'block', background: '#1a3a1a', border: '1px solid #2a5a2a', color: '#4caf50', borderRadius: 12, padding: '13px 20px', textDecoration: 'none', fontWeight: 600, fontSize: 14, textAlign: 'center', marginTop: 4 }}>
          View Full Menu →
        </a>
      </div>
    </div>
  );
}
