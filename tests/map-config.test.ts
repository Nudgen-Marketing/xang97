import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LANGUAGE,
  GOOGLE_MAPS_MAP_ID,
  GOOGLE_MAPS_REGION,
  MAP_ISSUE_URL,
  VIETNAM_CENTER,
  VIETNAM_MAP_BOUNDS
} from "@/lib/constants";
import { getGoogleMapsMapId, shouldUseAdvancedMarkers } from "@/lib/google-maps";

function isInsideVietnamMapBounds(point: { latitude: number; longitude: number }) {
  return (
    point.latitude >= VIETNAM_MAP_BOUNDS.southWest.latitude &&
    point.latitude <= VIETNAM_MAP_BOUNDS.northEast.latitude &&
    point.longitude >= VIETNAM_MAP_BOUNDS.southWest.longitude &&
    point.longitude <= VIETNAM_MAP_BOUNDS.northEast.longitude
  );
}

test("Vietnam map configuration center is inside bounds", () => {
  assert.ok(isInsideVietnamMapBounds(VIETNAM_CENTER));
});

test("Google Maps defaults are Vietnam-focused and key-driven", () => {
  assert.equal(GOOGLE_MAPS_API_KEY, process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "");
  assert.equal(GOOGLE_MAPS_MAP_ID, process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "");
  assert.equal(GOOGLE_MAPS_LANGUAGE, "vi");
  assert.equal(GOOGLE_MAPS_REGION, "VN");
  assert.equal(MAP_ISSUE_URL, "https://support.google.com/maps/");
});

test("Google Maps marker mode falls back to legacy markers without a map ID", () => {
  assert.equal(shouldUseAdvancedMarkers(""), false);
  assert.equal(shouldUseAdvancedMarkers("   "), false);
  assert.equal(shouldUseAdvancedMarkers("a97-google-cloud-map-id"), true);
});

test("Google Maps mapId normalization trims whitespace", () => {
  assert.equal(getGoogleMapsMapId(""), undefined);
  assert.equal(getGoogleMapsMapId("   "), undefined);
  assert.equal(getGoogleMapsMapId(" my-map-id "), "my-map-id");
});
