import { listPublicStations } from "@/lib/stations";
import { jsonError, jsonOk } from "@/lib/http";
import { parseStationSearchParams } from "@/lib/station-search";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const stations = await listPublicStations({
      search: parseStationSearchParams(request.url),
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize")
    });
    return jsonOk(stations);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load public A97 stations", error);
    }

    return jsonError("Không thể tải danh sách cây xăng A97", 500);
  }
}
