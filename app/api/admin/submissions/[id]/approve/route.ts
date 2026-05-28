import { SubmissionStatus } from "@/src/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatZodError, handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { invalidateStationsCache } from "@/lib/stations";
import { moderationSchema } from "@/lib/validation";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  if (!(await requireAdmin())) {
    return jsonError("Chưa đăng nhập", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = moderationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Dữ liệu duyệt không hợp lệ", 422, formatZodError(parsed.error));
  }

  const { id } = await params;
  const prisma = getPrisma();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const pendingSubmission = await tx.gasStationSubmission.findFirst({
        where: { id, status: SubmissionStatus.PENDING }
      });

      if (!pendingSubmission) {
        throw new Error("SUBMISSION_NOT_PENDING");
      }

      const station = await tx.gasStation.create({
        data: {
          name: parsed.data.name,
          brand: parsed.data.brand,
          address: parsed.data.address,
          ward: parsed.data.ward,
          district: parsed.data.district,
          province: parsed.data.province,
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
          notes: parsed.data.notes,
          source: "public-submission",
          lastVerifiedAt: new Date()
        }
      });

      const submission = await tx.gasStationSubmission.update({
        where: { id },
        data: {
          stationId: station.id,
          status: SubmissionStatus.APPROVED,
          moderationNotes: parsed.data.moderationNotes,
          reviewedAt: new Date()
        }
      });

      return { station, submission };
    });

    await invalidateStationsCache();
    return jsonOk({ stationId: result.station.id, submissionId: result.submission.id });
  } catch (error) {
    if (error instanceof Error && error.message === "SUBMISSION_NOT_PENDING") {
      return jsonError("Đề xuất không tồn tại hoặc đã được xử lý", 409);
    }

    return handleRouteError(error, "Không thể duyệt đề xuất lúc này");
  }
}
