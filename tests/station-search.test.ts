import assert from "node:assert/strict";
import test from "node:test";
import { filterStations, parseStationSearchParams } from "@/lib/station-search";
import type { PublicStation } from "@/lib/stations";

const stations: PublicStation[] = [
  {
    id: "hcm",
    name: "Cây xăng A97 Thủ Đức",
    brand: "Petrolimex",
    address: "Quốc lộ 1A",
    ward: null,
    district: "Thủ Đức",
    province: "TP. Hồ Chí Minh",
    latitude: 10.849,
    longitude: 106.772,
    notes: null,
    source: "manual",
    lastVerifiedAt: null,
    updatedAt: "2026-05-25T00:00:00.000Z"
  },
  {
    id: "hanoi",
    name: "Trạm A97 Hà Nội",
    brand: null,
    address: "Đường Giải Phóng",
    ward: null,
    district: "Hoàng Mai",
    province: "Hà Nội",
    latitude: 21.027763,
    longitude: 105.83416,
    notes: null,
    source: "manual",
    lastVerifiedAt: null,
    updatedAt: "2026-05-25T00:00:00.000Z"
  }
];

test("filterStations searches station text fields", () => {
  const results = filterStations(stations, { query: "thủ đức" });
  assert.deepEqual(
    results.map((station) => station.id),
    ["hcm"]
  );
});

test("filterStations sorts and limits by radius around origin", () => {
  const results = filterStations(stations, {
    origin: { latitude: 10.7769, longitude: 106.7009 },
    radiusKm: 30
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].id, "hcm");
  assert.equal(typeof results[0].distanceKm, "number");
});

test("parseStationSearchParams extracts query, origin, and radius", () => {
  const params = parseStationSearchParams(
    "http://localhost:3000/api/stations?q=Ha%20Noi&lat=21&lng=105.8&radiusKm=25"
  );

  assert.equal(params.query, "Ha Noi");
  assert.deepEqual(params.origin, { latitude: 21, longitude: 105.8 });
  assert.equal(params.radiusKm, 25);
});
