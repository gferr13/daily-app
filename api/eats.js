export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { lat, lng, type, radius = 1500 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const PLACES_KEY = process.env.GOOGLE_PLACES_KEY;

  try {
    const url = `https://places.googleapis.com/v1/places:searchNearby`;
    const body = {
      includedTypes: type ? [type] : ['restaurant', 'cafe', 'bar', 'bakery', 'pizza_restaurant', 'fast_food_restaurant'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
          radius: parseFloat(radius)
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.primaryTypeDisplayName,places.photos,places.location'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const places = (data.places || []).map(p => {
      const pLat = p.location?.latitude;
      const pLng = p.location?.longitude;
      let distanceMiles = null;
      if (pLat && pLng) {
        const R = 3958.8;
        const dLat = (pLat - userLat) * Math.PI / 180;
        const dLon = (pLng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(userLat*Math.PI/180) * Math.cos(pLat*Math.PI/180) * Math.sin(dLon/2)**2;
        distanceMiles = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
      }
      return { ...p, distanceMiles };
    });
    return res.status(200).json({ ...data, places });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
