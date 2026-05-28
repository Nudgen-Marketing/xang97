import assert from "node:assert/strict";
import test from "node:test";
import { stationSubmissionSchema } from "@/lib/validation";

const validSubmission = {
  name: "Cây xăng A97 Thủ Đức",
  address: "123 Quốc lộ 1A",
  province: "TP. Hồ Chí Minh",
  latitude: 10.849,
  longitude: 106.772
};

test("stationSubmissionSchema accepts a valid Vietnam coordinate submission", () => {
  const parsed = stationSubmissionSchema.safeParse(validSubmission);
  assert.equal(parsed.success, true);
});

test("stationSubmissionSchema rejects coordinates outside Vietnam bounds", () => {
  const parsed = stationSubmissionSchema.safeParse({
    ...validSubmission,
    latitude: 40.7128,
    longitude: -74.006
  });

  assert.equal(parsed.success, false);
});

test("stationSubmissionSchema normalizes optional empty strings", () => {
  const parsed = stationSubmissionSchema.parse({
    ...validSubmission,
    brand: "",
    sourceUrl: ""
  });

  assert.equal(parsed.brand, undefined);
  assert.equal(parsed.sourceUrl, undefined);
});
