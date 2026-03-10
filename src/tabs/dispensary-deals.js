// Scrapes specials from all 3 local dispensary websites
// AZ Supply + Blue Oak use Dispense (SSR, parse RSC payload)
// Emerald Tea uses Dutchie GraphQL

const STORES = {
  'az-supply': {
    name: 'A-Z Supply',
    emoji: '🅰️',
    url: 'https://azsupplynj.com/order/offers',
    menuUrl: 'https://azsupplynj.com/order',
    platform: 'dispense',
  },
  'blue-oak': {
    name: 'Blue Oak',
    emoji: '🌳',
    url: 'https://blueoaknj.com/shop/offers',
    menuUrl: 'https://blueoaknj.com/shop',
    platform: 'dispense',
  },
  'emerald-tea': {
    name: 'Emerald Tea Supply Co.',
    emoji: '🍵',
    url: 'https://etsc.store/menu?dtche%5Bpath%5D=specials',
    menuUrl: 'https://etsc.store/shop',
    platform: 'dutchie',
    dutchieId: '65b9530aa0a3e600090a7646',
    dutchieSlug: 'emerald-tea-supply-company',
  },
};

// In-memory cache
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

async function scrapeDispense(store) {
  try {
    const r = await fetch(store.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });
    const html = await r.text();

    // Extract RSC payload from script tags
    const allChunks = [];
    const scriptRegex = /self\.__next_f\.push\(\[.*?\]\)/gs;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      allChunks.push(match[0]);
    }
    const allText = allChunks.join('');

    // Check if truly no specials
    if (allText.includes('EMPTY_STATE') || html.includes('Nothing here')) {
      return { ...store, deals: [], noDeals: true };
    }

    // Try to parse product deals from RSC
    const deals = [];
    // Look for product price/discount patterns
    const priceMatches = allText.matchAll(/"name":"([^"]+)"[^}]*"originalPrice":(\d+)[^}]*"price":(\d+)/g);
    for (const m of priceMatches) {
      const name = m[1];
      const original = parseFloat(m[2]) / 100;
      const sale = parseFloat(m[3]) / 100;
      if (sale < original) {
        const pct = Math.round((1 - sale/original) * 100);
        deals.push({ title: name, description: `${pct}% off — $${sale.toFixed(2)} (was $${original.toFixed(2)})` });
      }
    }

    return { ...store, deals };
  } catch (e) {
    return { ...store, deals: [], error: e.message };
  }
}

async function scrapeDutchie(store) {
  try {
    const query = `
      query SpecialsMenu($retailerId: ID!) {
        menu(retailerId: $retailerId, includeEnterpriseSpecials: true, pricingType: recreational) {
          products(filter: {subcategory: "Specials"}) {
            id name brand category
            image { url }
            variants {
              option priceRec specialPriceRec
            }
          }
        }
      }
    `;

    const r = await fetch('https://dutchie.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apollographql-client-name': 'embedded-menu',
        'apollographql-client-version': '1.0.0',
      },
      body: JSON.stringify({
        query,
        variables: { retailerId: store.dutchieId }
      })
    });

    if (!r.ok) throw new Error(`Dutchie ${r.status}`);
    const data = await r.json();
    const products = data?.data?.menu?.products || [];

    const deals = products.map(p => {
      const variant = p.variants?.[0];
      const regular = variant?.priceRec;
      const special = variant?.specialPriceRec;
      return {
        title: p.name,
        brand: p.brand,
        description: special && regular && special < regular
          ? `$${special} (reg $${regular})`
          : special ? `$${special}` : '',
        image: p.image?.url,
      };
    });

    return { ...store, deals };
  } catch (e) {
    // Fallback: try different query structure
    try {
      const r2 = await fetch(`https://dutchie.com/api/v2/embedded-menu/${store.dutchieId}.js`, {
        headers: { 'Referer': 'https://dutchie.com/', 'Accept': '*/*' }
      });
      // If that works, specials data would need JS parsing — skip
    } catch {}
    return { ...store, deals: [], error: e.message };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Serve from cache if fresh
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cache);
  }

  const { store } = req.query;

  // Scrape all stores or a specific one
  const targets = store
    ? [STORES[store]].filter(Boolean)
    : Object.values(STORES);

  const results = await Promise.all(targets.map(s =>
    s.platform === 'dutchie' ? scrapeDutchie(s) : scrapeDispense(s)
  ));

  const payload = {
    stores: results.map(r => ({
      id: Object.keys(STORES).find(k => STORES[k].name === r.name),
      name: r.name,
      emoji: r.emoji,
      menuUrl: r.menuUrl,
      deals: r.deals || [],
      noDeals: r.noDeals || false,
      error: r.error || null,
      cachedAt: new Date().toISOString(),
    })),
    fetchedAt: new Date().toISOString(),
  };

  // Update cache
  if (!store) {
    cache = payload;
    cacheTime = Date.now();
  }

  res.setHeader('Cache-Control', 'public, s-maxage=10800');
  return res.status(200).json(payload);
}
