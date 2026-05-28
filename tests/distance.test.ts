import assert from "node:assert/strict";
import test from "node:test";
import { distanceKm, sortStationsByDistance } from "@/lib/distance";

test("distanceKm returns a realistic Vietnam city distance", () => {
  const hanoi = { latitude: 21.027763, longitude: 105.83416 };
  const danang = { latitude: 16.047079, longitude: 108.20623 };

  const distance = distanceKm(hanoi, danang);

  assert.ok(distance > 600);
  assert.ok(distance < 700);
});

test("sortStationsByDistance keeps inputs immutable and sorts nearest first", () => {
  const origin = { latitude: 10.7769, longitude: 106.7009 };
  const stations = [
    { id: "far", latitude: 21.027763, longitude: 105.83416 },
    { id: "near", latitude: 10.78, longitude: 106.7 }
  ];

  const sorted = sortStationsByDistance(stations, origin);

  assert.equal(sorted[0].id, "near");
  assert.equal(stations[0].id, "far");
  assert.ok(sorted[0].distanceKm < sorted[1].distanceKm);
});
