// api/gas.js — EIA.gov gas price proxy
// Free API key at https://www.eia.gov/opendata/ (takes 30 seconds)
// Set EIA_KEY in Vercel env vars, or leave blank to use DEMO_KEY (rate limited)

const EIA_KEY = process.env.EIA_KEY || "wVm2EdL72VVaIZeknJhKtkd70RQonX27fUT7g9m0";

// Series IDs for NJ/Central Atlantic region (PADD 1B covers NJ/NY/PA)
const SERIES = {
  regular:   "EMM_EPMR_PTE_R1B_DPG",   // Regular unleaded, Central Atlantic
  midgrade:  "EMM_EPMM_PTE_R1B_DPG",   // Mid-grade, Central Atlantic
  premium:   "EMM_EPMP_PTE_R1B_DPG",   // Premium, Central Atlantic
  diesel:    "EMM_EPD2D_PTE_R1B_DPG",  // Diesel, Central Atlantic
  us_regular:"EMM_EPMR_PTE_NUS_DPG",   // US average regular (for comparison)
};

async function fetchSeries(seriesId) {
  const url = `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${EIA_KEY}&frequency=weekly&data[0]=value&facets[series][]=${seriesId}&sort[0][column]=period&sort[0][direction]=desc&length=8`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`EIA ${r.status}`);
  const json = await r.json();
  return (json?.response?.data || []).map(d => ({
    date: d.period,
    price: parseFloat(d.value),
  }));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const [regular, midgrade, premium, diesel, us] = await Promise.all([
      fetchSeries(SERIES.regular),
      fetchSeries(SERIES.midgrade),
      fetchSeries(SERIES.premium),
      fetchSeries(SERIES.diesel),
      fetchSeries(SERIES.us_regular),
    ]);

    return res.status(200).json({
      region: "Central Atlantic (NJ/NY/PA)",
      updated: regular[0]?.date || null,
      current: {
        regular:  regular[0]?.price  || null,
        midgrade: midgrade[0]?.price || null,
        premium:  premium[0]?.price  || null,
        diesel:   diesel[0]?.price   || null,
        us_avg:   us[0]?.price       || null,
      },
      trend: {
        regular:  regular.slice(0, 6).reverse(),
        us_avg:   us.slice(0, 6).reverse(),
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
