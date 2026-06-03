import assert from "node:assert/strict";
import test from "node:test";
import { getStationStatusAction } from "@/lib/admin-station-status";

test("getStationStatusAction builds deactivate metadata for active stations", () => {
  const action = getStationStatusAction({
    id: "station-active",
    name: "Cua hang XD so 8",
    status: "ACTIVE"
  });

  assert.deepEqual(action, {
    kind: "deactivate",
    stationId: "station-active",
    stationName: "Cua hang XD so 8",
    nextStatus: "INACTIVE",
    path: "/api/admin/stations/station-active/deactivate",
    ariaLabel: "Ẩn cây xăng Cua hang XD so 8",
    title: "Ẩn cây xăng này?",
    description:
      "Cua hang XD so 8 sẽ không còn hiển thị trên bản đồ công khai cho đến khi được kích hoạt lại.",
    confirmLabel: "Ẩn cây xăng"
  });
});

test("getStationStatusAction builds activate metadata for inactive stations", () => {
  const action = getStationStatusAction({
    id: "station-inactive",
    name: "Cua hang XD so 10",
    status: "INACTIVE"
  });

  assert.deepEqual(action, {
    kind: "activate",
    stationId: "station-inactive",
    stationName: "Cua hang XD so 10",
    nextStatus: "ACTIVE",
    path: "/api/admin/stations/station-inactive/activate",
    ariaLabel: "Kích hoạt lại cây xăng Cua hang XD so 10",
    title: "Kích hoạt lại cây xăng này?",
    description:
      "Cua hang XD so 10 sẽ hiển thị lại trên bản đồ công khai sau khi cache được làm mới.",
    confirmLabel: "Kích hoạt lại"
  });
});
