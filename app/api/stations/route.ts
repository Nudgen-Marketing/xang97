import { listPublicStations } from "@/lib/stations";
import { jsonError, jsonOk } from "@/lib/http";
import { filterStations, parseStationSearchParams } from "@/lib/station-search";

export async function GET(request: Request) {
  try {
    const stations = await listPublicStations();
    return jsonOk(filterStations(stations, parseStationSearchParams(request.url)));
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load public A97 stations", error);
    }

    return jsonError("Không thể tải danh sách cây xăng A97", 500);
  }
}
