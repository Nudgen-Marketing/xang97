import assert from "node:assert/strict";
import { test } from "node:test";
import { getRadiusCameraPadding, shouldFitRadiusForCamera } from "@/lib/map-camera";

test("radius bounds fit whenever a user location and radius bounds are available", () => {
  assert.equal(shouldFitRadiusForCamera({ hasUserLocation: true, hasRadiusBounds: true }), true);
  assert.equal(shouldFitRadiusForCamera({ hasUserLocation: false, hasRadiusBounds: true }), false);
  assert.equal(shouldFitRadiusForCamera({ hasUserLocation: true, hasRadiusBounds: false }), false);
});

test("radius camera padding adapts to the map viewport size", () => {
  assert.equal(getRadiusCameraPadding({ width: 360, height: 640 }), 32);
  assert.equal(getRadiusCameraPadding({ width: 640, height: 560 }), 48);
  assert.equal(getRadiusCameraPadding({ width: 1024, height: 720 }), 64);
});
