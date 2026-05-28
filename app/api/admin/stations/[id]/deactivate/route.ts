import { StationStatus } from "@/src/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { invalidateStationsCache } from "@/lib/stations";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: Params) {
  if (!(await requireAdmin())) {
    return jsonError("Chưa đăng nhập", 401);
  }

  const { id } = await params;
  const prisma = getPrisma();
  try {
    const station = await prisma.gasStation.update({
      where: { id },
      data: { status: StationStatus.INACTIVE }
    });

    await invalidateStationsCache();
    return jsonOk({ id: station.id, status: station.status });
  } catch (error) {
    return handleRouteError(error, "Không thể ẩn cây xăng lúc này");
  }
}
