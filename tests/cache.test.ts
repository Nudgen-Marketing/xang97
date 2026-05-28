import assert from "node:assert/strict";
import test from "node:test";
import { STATIONS_CACHE_TTL_SECONDS } from "@/lib/constants";

test("station cache TTL is exactly 30 minutes", () => {
  assert.equal(STATIONS_CACHE_TTL_SECONDS, 1800);
});
