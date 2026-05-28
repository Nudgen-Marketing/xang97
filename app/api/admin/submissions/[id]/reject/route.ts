import { SubmissionStatus } from "@/src/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  if (!(await requireAdmin())) {
    return jsonError("Chưa đăng nhập", 401);
  }

  const body = await request.json().catch(() => ({}));
  const moderationNotes =
    typeof body?.moderationNotes === "string" ? body.moderationNotes.trim() : undefined;
  const { id } = await params;
  const prisma = getPrisma();

  try {
    const submission = await prisma.gasStationSubmission.update({
      where: { id, status: SubmissionStatus.PENDING },
      data: {
        status: SubmissionStatus.REJECTED,
        moderationNotes,
        reviewedAt: new Date()
      }
    });

    return jsonOk({ id: submission.id, status: submission.status });
  } catch (error) {
    return handleRouteError(error, "Không thể từ chối đề xuất lúc này");
  }
}
