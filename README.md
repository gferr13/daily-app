# Daily App

Three-tab mobile app: Grocery Deals · Gas Prices · Local Events

## Deploy (3 commands)

```bash
npm install -g vercel   # one time
npm install
vercel --prod
```

Then add your API keys in Vercel → Project → Settings → Environment Variables:

| Variable | Value | Required? |
|---|---|---|
| `PREDICTHQ_KEY` | Your PredictHQ API key | Yes for Events tab |
| `EIA_KEY` | Free key from eia.gov/opendata | Optional (DEMO_KEY used otherwise) |

---

## Tabs

### 🛒 Deals
- Live weekly circulars from ShopRite, Stop & Shop, Stew Leonard's, Costco, Whole Foods, Trader Joe's
- Filter by store, category, sort by % off or price
- This Week / Next Week toggle

### ⛽ Gas
- Real prices from US EIA (Energy Information Administration)
- Central Atlantic region (NJ/NY/PA) + US national average
- Regular, mid-grade, premium, diesel
- 6-week trend with sparkline

### 📍 Events
- Powered by PredictHQ
- 30-mile radius from Bloomfield NJ (ZIP 07003)
- All categories: concerts, sports, festivals, community, arts, food & drink
- Grouped by date, ranked by attendance impact

---

## Get API keys

**PredictHQ** — https://www.predicthq.com/ (free tier available)

**EIA** — https://www.eia.gov/opendata/ (free, instant, no credit card)

## Local dev

```bash
npm install
vercel dev
```
