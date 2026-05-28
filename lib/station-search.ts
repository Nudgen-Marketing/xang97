import { sortStationsByDistance, type Coordinates } from "@/lib/distance";
import type { PublicStation } from "@/lib/stations";

export type StationSearchOptions = {
  query?: string | null;
  origin?: Coordinates | null;
  radiusKm?: number | null;
};

export type PublicStationSearchResult = PublicStation & {
  distanceKm?: number;
};

function stationSearchText(station: PublicStation) {
  return [
    station.name,
    station.brand,
    station.address,
    station.ward,
    station.district,
    station.province
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterStations(
  stations: readonly PublicStation[],
  options: StationSearchOptions
): PublicStationSearchResult[] {
  const normalizedQuery = options.query?.trim().toLowerCase();
  const textFiltered = normalizedQuery
    ? stations.filter((station) => stationSearchText(station).includes(normalizedQuery))
    : [...stations];

  if (!options.origin) {
    return textFiltered;
  }

  const radiusKm = options.radiusKm && options.radiusKm > 0 ? options.radiusKm : undefined;
  const sorted = sortStationsByDistance(textFiltered, options.origin);

  return radiusKm ? sorted.filter((station) => station.distanceKm <= radiusKm) : sorted;
}

export function parseStationSearchParams(url: string) {
  const searchParams = new URL(url).searchParams;
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lng"));
  const radiusKm = Number(searchParams.get("radiusKm"));
  const hasOrigin = Number.isFinite(latitude) && Number.isFinite(longitude);

  return {
    query: searchParams.get("q"),
    origin: hasOrigin
      ? {
          latitude,
          longitude
        }
      : null,
    radiusKm: Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm : null
  };
}
