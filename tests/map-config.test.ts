import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LANGUAGE,
  GOOGLE_MAPS_MAP_ID,
  GOOGLE_MAPS_REGION,
  MAP_ISSUE_URL,
  VIETNAM_ARCHIPELAGOS,
  VIETNAM_CENTER,
  VIETNAM_MAP_BOUNDS
} from "@/lib/constants";
import { shouldUseAdvancedMarkers } from "@/lib/google-maps";

function isInsideVietnamMapBounds(point: { latitude: number; longitude: number }) {
  return (
    point.latitude >= VIETNAM_MAP_BOUNDS.southWest.latitude &&
    point.latitude <= VIETNAM_MAP_BOUNDS.northEast.latitude &&
    point.longitude >= VIETNAM_MAP_BOUNDS.southWest.longitude &&
    point.longitude <= VIETNAM_MAP_BOUNDS.northEast.longitude
  );
}

test("Vietnam map configuration includes Hoàng Sa and Trường Sa labels inside bounds", () => {
  assert.deepEqual(
    VIETNAM_ARCHIPELAGOS.map((archipelago) => archipelago.name),
    ["Quần đảo Hoàng Sa", "Quần đảo Trường Sa"]
  );
  assert.ok(isInsideVietnamMapBounds(VIETNAM_CENTER));

  for (const archipelago of VIETNAM_ARCHIPELAGOS) {
    assert.ok(isInsideVietnamMapBounds(archipelago), `${archipelago.name} must be inside bounds`);
  }
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
