// Client-side Haversine distance — used for terrain radius filtering.
// Firestore geoqueries are out of scope for v1.

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Returns the great-circle distance in kilometres between two coordinates.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Approximate centroids for each mock region.
 * When Firestore is live, replace with a real reverse-geocode API call.
 */
const REGION_CENTROIDS: { region: string; lat: number; lng: number }[] = [
  { region: 'Île-de-France',          lat: 48.8566, lng:  2.3522 },
  { region: 'Occitanie',              lat: 43.6047, lng:  1.4442 },
  { region: 'Auvergne-Rhône-Alpes',   lat: 45.7640, lng:  4.8357 },
  { region: 'Bretagne',               lat: 48.1173, lng: -1.6778 },
  { region: 'PACA',                   lat: 43.2965, lng:  5.3698 },
];

/**
 * Returns the name of the region whose centroid is closest to the given
 * GPS coordinates, or null if the centroid list is empty.
 */
export function getNearestRegion(lat: number, lng: number): string | null {
  if (REGION_CENTROIDS.length === 0) return null;
  let nearest = REGION_CENTROIDS[0];
  let minDist = haversineDistance(lat, lng, nearest.lat, nearest.lng);
  for (let i = 1; i < REGION_CENTROIDS.length; i++) {
    const d = haversineDistance(lat, lng, REGION_CENTROIDS[i].lat, REGION_CENTROIDS[i].lng);
    if (d < minDist) { minDist = d; nearest = REGION_CENTROIDS[i]; }
  }
  return nearest.region;
}
