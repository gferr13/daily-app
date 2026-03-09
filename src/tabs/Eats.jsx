import { useState, useEffect } from 'react';

const CATEGORIES = [
  { id: 'restaurants',  label: 'Restaurants',    icon: '🍽',  types: ['restaurant'] },
  { id: 'cafes',        label: 'Coffee & Cafes', icon: '☕',  types: ['cafe', 'coffee_shop'] },
  { id: 'bars',         label: 'Bars',           icon: '🍺',  types: ['bar'] },
  { id: 'pizza',        label: 'Pizza',          icon: '🍕',  types: ['pizza_restaurant'] },
  { id: 'fastfood',     label: 'Fast Food',      icon: '🍔',  types: ['fast_food_restaurant'] },
  { id: 'bakeries',     label: 'Bakeries',       icon: '🥐',  types: ['bakery'] },
  { id: 'dessert',      label: 'Ice Cream',      icon: '🍦',  types: ['ice_cream_shop', 'dessert_shop'] },
  { id: 'familyfun',    label: 'Family Fun',     icon: '🎉',  types: ['amusement_park', 'bowling_alley', 'movie_theater', 'miniature_golf', 'playground', 'amusement_center'] },
  { id: 'dispensary',   label: 'Dispensaries',   icon: '🌿',  types: ['cannabis_store'] },
  { id: 'grocery',      label: 'Grocery',        icon: '🛒',  types: ['grocery_store', 'supermarket'] },
  { id: 'sushi',        label: 'Sushi',          icon: '🍣',  types: ['sushi_restaurant', 'japanese_restaurant'] },
  { id: 'mexican',      label: 'Mexican',        icon: '🌮',  types: ['mexican_restaurant'] },
  { id: 'italian',      label: 'Italian',        icon: '🍝',  types: ['italian_restaurant'] },
  { id: 'chinese',      label: 'Chinese',        icon: '🥢',  types: ['chinese_restaurant'] },
  { id: 'indian',       label: 'Indian',         icon: '🍛',  types: ['indian_restaurant'] },
  { id: 'brunch',       label: 'Brunch',         icon: '🥞',  types: ['brunch_restaurant', 'breakfast_restaurant'] },
];

const PRICE_MAP = {
  PRICE_LEVEL_FREE: 'Free',
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};

function Stars({ rating }) {
  if (!rating) return <span style={{ color: '#555', fontSize: 12 }}>No rating</span>;
  return (
    <span>
      <span style={{ color: '#f59e0b', fontSize: 13 }}>{'★'.repeat(Math.round(rating))}</span>
      <span style={{ color: '#aaa', fontSize: 11, marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

export default function Eats() {
  const [coords, setCoords] = useState(null);
  const [locGranted, setLocGranted] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [radius, setRadius] = useState(1500);

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocGranted(true);
      },
      () => {
        setCoords({ lat: 40.8126, lng: -74.1854 });
        setLocGranted(true);
      },
      { timeout: 8000 }
    );
  };

  const openCategory = (cat) => {
    setActiveCategory(cat);
    setSearch('');
    setPlaces([]);
    setError(null);
  };

  const goBack = () => {
    setActiveCategory(null);
    setPlaces([]);
    setError(null);
    setSearch('');
  };

  useEffect(() => {
    if (!coords || !activeCategory) return;
    fetchPlaces();
  }, [coords, activeCategory, radius]);

  const fetchPlaces = async () => {
    setLoading(true);
    setError(null);
    try {
      // Dispensaries: use Weedmaps API
      if (activeCategory.id === 'dispensary') {
        const params = new URLSearchParams({ lat: coords.lat, lng: coords.lng, radius: Math.round(radius / 1609) || 5 });
        const res = await fetch(`/api/weedmaps?${params}`);
        const data = await res.json();
        const mapped = (data.dispensaries || []).map(d => ({
          id: d.id || d.slug,
          displayName: { text: d.name },
          formattedAddress: d.address || d.city,
          rating: d.rating,
          userRatingCount: d.reviews_count,
          currentOpeningHours: { openNow: d.open_now },
          websiteUri: d.menu_url || `https://weedmaps.com/dispensaries/${d.slug}`,
          isWeedmaps: true,
        }));
        setPlaces(mapped);
        return;
      }
      // All other categories: use Google Places
      const results = [];
      for (const type of activeCategory.types) {
        const params = new URLSearchParams({ lat: coords.lat, lng: coords.lng, radius, type });
        const res = await fetch(`/api/eats?${params}`);
        const data = await res.json();
        if (data.places) results.push(...data.places);
      }
      const seen = new Set();
      const deduped = results.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      setPlaces(deduped);
    } catch (e) {
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const filtered = places
    .filter(p => !search || (p.displayName?.text || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'rating'
      ? (b.rating || 0) - (a.rating || 0)
      : (b.userRatingCount || 0) - (a.userRatingCount || 0)
    );

  if (!locGranted) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📍</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Find places nearby</div>
        <div style={{ color: '#888', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
          Restaurants, bars, family fun, dispensaries and more — all near you
        </div>
        <button onClick={getLocation} style={{
          background: '#3b82f6', color: '#fff', border: 'none',
          borderRadius: 14, padding: '14px 32px', fontSize: 16,
          fontWeight: 600, cursor: 'pointer',
        }}>
          Use My Location
        </button>
      </div>
    );
  }

  if (!activeCategory) {
    return (
      <div style={{ padding: '20px 16px 80px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>What are you looking for?</div>
        <div style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>Tap a category to explore nearby</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => openCategory(cat)} style={{
              background: '#1e1e1e', border: '1px solid #2a2a2a',
              borderRadius: 14, padding: '18px 8px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8, cursor: 'pointer',
            }}>
              <span style={{ fontSize: 28 }}>{cat.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#ccc', textAlign: 'center', lineHeight: 1.3 }}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '12px 16px', background: '#1a1a1a', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={goBack} style={{
            background: '#2a2a2a', border: 'none', borderRadius: 20,
            padding: '6px 12px', color: '#fff', fontSize: 13,
            cursor: 'pointer',
          }}>← Back</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{activeCategory.icon} {activeCategory.label}</span>
        </div>
        <input type="text" placeholder={`Search ${activeCategory.label.toLowerCase()}...`}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', background: '#2a2a2a', border: '1px solid #333', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ flex: 1, background: '#2a2a2a', border: '1px solid #333', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13 }}>
            <option value="rating">Top Rated</option>
            <option value="reviews">Most Reviewed</option>
          </select>
          <select value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ flex: 1, background: '#2a2a2a', border: '1px solid #333', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13 }}>
            <option value={800}>½ mi</option>
            <option value={1500}>1 mi</option>
            <option value={3200}>2 mi</option>
            <option value={8000}>5 mi</option>
          </select>
        </div>
      </div>

      <div style={{ padding: '8px 16px 80px' }}>
        {loading && <div style={{ textAlign: 'center', color: '#666', padding: 48 }}>Finding {activeCategory.label.toLowerCase()} nearby...</div>}
        {error && <div style={{ background: '#2a1a1a', border: '1px solid #7f1d1d', borderRadius: 10, padding: 16, color: '#fca5a5', fontSize: 13 }}>{error}</div>}
        {!loading && !error && places.length === 0 && (
          <div style={{ color: '#555', textAlign: 'center', padding: 48 }}>
            No {activeCategory.label.toLowerCase()} found nearby.<br />
            <span style={{ fontSize: 12 }}>Try expanding the radius.</span>
          </div>
        )}
        {filtered.map((place, i) => {
          const name = place.displayName?.text || 'Unknown';
          const address = place.formattedAddress || '';
          const isOpen = place.currentOpeningHours?.openNow;
          return (
            <div key={place.id || i} style={{ background: '#1e1e1e', borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: '1px solid #2a2a2a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                  <div style={{ color: '#777', fontSize: 12, marginBottom: 5 }}>
                    {place.primaryTypeDisplayName?.text || ''}{place.priceLevel ? ' · ' + PRICE_MAP[place.priceLevel] : ''}
                  </div>
                  <Stars rating={place.rating} />
                  {place.userRatingCount > 0 && <span style={{ color: '#555', fontSize: 11, marginLeft: 5 }}>({place.userRatingCount.toLocaleString()})</span>}
                </div>
                {isOpen !== undefined && (
                  <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 10, flexShrink: 0, color: isOpen ? '#4ade80' : '#f87171', background: isOpen ? '#052e16' : '#2d0a0a', padding: '3px 8px', borderRadius: 20 }}>
                    {isOpen ? 'Open' : 'Closed'}
                  </span>
                )}
              </div>
              {address && <div style={{ color: '#444', fontSize: 11, marginTop: 6 }}>{address}</div>}
              {place.isWeedmaps && place.websiteUri && (
                <a href={place.websiteUri} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 700, color: '#4ade80', background: '#052e16', border: '1px solid #14532d', padding: '4px 10px', borderRadius: 8, textDecoration: 'none' }}>
                  View Menu on Weedmaps →
                </a>
              )}
            </div>
          );
        })}
        {!loading && filtered.length > 0 && (
          <div style={{ color: '#333', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
            {filtered.length} places • {activeCategory.id === 'dispensary' ? 'Weedmaps' : 'Google Places'}
          </div>
        )}
      </div>
    </div>
  );
}
