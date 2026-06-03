export type AdminStationStatus = "ACTIVE" | "INACTIVE";

export type StationStatusAction = {
  kind: "activate" | "deactivate";
  stationId: string;
  stationName: string;
  nextStatus: AdminStationStatus;
  path: string;
  ariaLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
};

type StationStatusActionInput = {
  id: string;
  name: string;
  status: AdminStationStatus;
};

export function getStationStatusAction(station: StationStatusActionInput): StationStatusAction {
  if (station.status === "ACTIVE") {
    return {
      kind: "deactivate",
      stationId: station.id,
      stationName: station.name,
      nextStatus: "INACTIVE",
      path: `/api/admin/stations/${encodeURIComponent(station.id)}/deactivate`,
      ariaLabel: `Ẩn cây xăng ${station.name}`,
      title: "Ẩn cây xăng này?",
      description: `${station.name} sẽ không còn hiển thị trên bản đồ công khai cho đến khi được kích hoạt lại.`,
      confirmLabel: "Ẩn cây xăng"
    };
  }

  return {
    kind: "activate",
    stationId: station.id,
    stationName: station.name,
    nextStatus: "ACTIVE",
    path: `/api/admin/stations/${encodeURIComponent(station.id)}/activate`,
    ariaLabel: `Kích hoạt lại cây xăng ${station.name}`,
    title: "Kích hoạt lại cây xăng này?",
    description: `${station.name} sẽ hiển thị lại trên bản đồ công khai sau khi cache được làm mới.`,
    confirmLabel: "Kích hoạt lại"
  };
}
