export const VIETNAM_CENTER = {
  latitude: 14.8,
  longitude: 109.8
};

export const VIETNAM_MAP_BOUNDS = {
  southWest: {
    latitude: 6.0,
    longitude: 101.0
  },
  northEast: {
    latitude: 24.0,
    longitude: 122.0
  }
};

export const VIETNAM_ARCHIPELAGOS = [
  {
    id: "hoang-sa",
    name: "Quần đảo Hoàng Sa",
    latitude: 16.5,
    longitude: 112.0
  },
  {
    id: "truong-sa",
    name: "Quần đảo Trường Sa",
    latitude: 10.0,
    longitude: 114.0
  }
] as const;

export const STATIONS_CACHE_KEY = "a97:stations:active:v1";
export const STATIONS_CACHE_TTL_SECONDS = 60 * 30;

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export const GOOGLE_MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "";

export const GOOGLE_MAPS_LANGUAGE = process.env.NEXT_PUBLIC_GOOGLE_MAP_LANGUAGE ?? "vi";

export const GOOGLE_MAPS_REGION = process.env.NEXT_PUBLIC_GOOGLE_MAP_REGION ?? "VN";

export const MAP_ISSUE_URL =
  process.env.NEXT_PUBLIC_MAP_ISSUE_URL ?? "https://support.google.com/maps/";
