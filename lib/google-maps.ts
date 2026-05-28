import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LANGUAGE,
  GOOGLE_MAPS_MAP_ID,
  GOOGLE_MAPS_REGION,
  VIETNAM_MAP_BOUNDS
} from "@/lib/constants";

let isGoogleMapsConfigured = false;

export const googleVietnamBounds: google.maps.LatLngBoundsLiteral = {
  south: VIETNAM_MAP_BOUNDS.southWest.latitude,
  west: VIETNAM_MAP_BOUNDS.southWest.longitude,
  north: VIETNAM_MAP_BOUNDS.northEast.latitude,
  east: VIETNAM_MAP_BOUNDS.northEast.longitude
};

export function hasGoogleMapsApiKey() {
  return GOOGLE_MAPS_API_KEY.trim().length > 0;
}

export function shouldUseAdvancedMarkers(mapId = GOOGLE_MAPS_MAP_ID) {
  return mapId.trim().length > 0;
}

function configureGoogleMaps() {
  if (!hasGoogleMapsApiKey()) {
    throw new Error("Thiếu NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");
  }

  if (isGoogleMapsConfigured) {
    return;
  }

  setOptions({
    key: GOOGLE_MAPS_API_KEY,
    v: "weekly",
    language: GOOGLE_MAPS_LANGUAGE,
    region: GOOGLE_MAPS_REGION,
    authReferrerPolicy: "origin",
    mapIds: shouldUseAdvancedMarkers() ? [GOOGLE_MAPS_MAP_ID] : undefined
  });
  isGoogleMapsConfigured = true;
}

export async function loadGoogleMapLibraries() {
  configureGoogleMaps();

  const [mapsLibrary, markerLibrary] = await Promise.all([
    importLibrary("maps") as Promise<google.maps.MapsLibrary>,
    importLibrary("marker") as Promise<google.maps.MarkerLibrary>
  ]);

  return {
    mapsLibrary,
    markerLibrary
  };
}

export async function loadGooglePlacesLibrary() {
  configureGoogleMaps();
  return importLibrary("places") as Promise<google.maps.PlacesLibrary>;
}
