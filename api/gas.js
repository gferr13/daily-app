const EIA_KEY = process.env.EIA_KEY || "wVm2EdL72VVaIZeknJhKtkd70RQonX27fUT7g9m0";
const PLACES_KEY = process.env.GOOGLE_PLACES_KEY;

const SERIES = {
  regular:    "EMM_EPMR_PTE_R1B_DPG",
  midgrade:   "EMM_EPMM_PTE_R1B_DPG",
  premium:    "EMM_EPMP_PTE_R1B_DPG",
  diesel:     "EMM_EPD2D_PTE_R1B_DPG",
  us_avg:     "EMM_EPMR_PTE_NUS_DPG",
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function fetchEIA(seriesId) {
  const url = `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${EIA_KEY}&frequency=weekly&data[0]=value&facets[series][]=${seriesId}&sort[0][column]=period&sort[0][direction]=desc&length=6&offset=0`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const json = await r.json();
  return (json.response?.data || []).map(d => ({ date: d.period, price: parseFloat(d.value) }));
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
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.currentOpeningHours,places.rating,places.location",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.places || []).map(p => {
    const sLat = p.location?.latitude;
    const sLng = p.location?.longitude;
    const dist = (sLat && sLng) ? haversineDistance(parseFloat(lat), parseFloat(lng), sLat, sLng) : null;
    return {
      name: p.displayName?.text || "Gas Station",
      address: p.formattedAddress || "",
      isOpen: p.currentOpeningHours?.openNow,
      rating: p.rating,
      lat: sLat,
      lng: sLng,
      distanceMiles: dist ? Math.round(dist * 10) / 10 : null,
    };
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { lat, lng } = req.query;
    const [regular, midgrade, premium, diesel, us] = await Promise.all([
      fetchEIA(SERIES.regular),
      fetchEIA(SERIES.midgrade),
      fetchEIA(SERIES.premium),
      fetchEIA(SERIES.diesel),
      fetchEIA(SERIES.us_avg),
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
