// Gas: EIA regional average + Google Places nearby stations
const EIA_KEY = process.env.EIA_KEY || "wVm2EdL72VVaIZeknJhKtkd70RQonX27fUT7g9m0";
const PLACES_KEY = process.env.GOOGLE_PLACES_KEY;

const SERIES = {
  regular:    "EMM_EPMR_PTE_R1B_DPG",
  midgrade:   "EMM_EPMM_PTE_R1B_DPG",
  premium:    "EMM_EPMP_PTE_R1B_DPG",
  diesel:     "EMM_EPD2D_PTE_R1B_DPG",
  us_regular: "EMM_EPMR_PTE_NUS_DPG",
};

async function fetchSeries(seriesId) {
  // Build URL manually to avoid bracket encoding issues
  const url = `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${EIA_KEY}&frequency=weekly&data[0]=value&facets[series][]=${seriesId}&sort[0][column]=period&sort[0][direction]=desc&length=8`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`EIA ${r.status}: ${await r.text()}`);
  const json = await r.json();
  const rows = json?.response?.data || [];
  return rows.map(d => ({ date: d.period, price: parseFloat(d.value) }));
}

async function fetchNearbyStations(lat, lng, radius = 5000) {
  const url = "https://places.googleapis.com/v1/places:searchNearby";
  const body = {
    includedTypes: ["gas_station"],
    maxResultCount: 15,
    locationRestriction: {
      circle: {
        center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
        radius: parseFloat(radius),
      },
    },
  };
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.currentOpeningHours,places.rating",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.places || []).map(p => ({
    name: p.displayName?.text || "Gas Station",
    address: p.formattedAddress || "",
    isOpen: p.currentOpeningHours?.openNow,
    rating: p.rating,
  }));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { lat, lng } = req.query;

  try {
    const [regular, midgrade, premium, diesel, us] = await Promise.all([
      fetchSeries(SERIES.regular),
      fetchSeries(SERIES.midgrade),
      fetchSeries(SERIES.premium),
      fetchSeries(SERIES.diesel),
      fetchSeries(SERIES.us_regular),
    ]);

    const stations = lat && lng ? await fetchNearbyStations(lat, lng) : [];

    return res.status(200).json({
      region: "NJ/Central Atlantic",
      updated: regular[0]?.date || null,
      current: {
        regular:  regular[0]?.price  || null,
        midgrade: midgrade[0]?.price || null,
        premium:  premium[0]?.price  || null,
        diesel:   diesel[0]?.price   || null,
        us_avg:   us[0]?.price       || null,
      },
      trend: {
        regular: regular.slice(0, 6).reverse(),
        us_avg:  us.slice(0, 6).reverse(),
      },
      stations,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
