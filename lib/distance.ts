export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type DistanceStation = Coordinates & {
  id: string;
};

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function distanceKm(from: Coordinates, to: Coordinates) {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortStationsByDistance<T extends DistanceStation>(
  stations: readonly T[],
  origin: Coordinates
) {
  return [...stations]
    .map((station) => ({
      ...station,
      distanceKm: distanceKm(origin, station)
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
