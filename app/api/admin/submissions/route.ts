import { SubmissionStatus } from "@/src/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) {
    return jsonError("Chưa đăng nhập", 401);
  }

  const prisma = getPrisma();
  const submissions = await prisma.gasStationSubmission.findMany({
    where: { status: SubmissionStatus.PENDING },
    orderBy: { createdAt: "asc" }
  });

  return jsonOk(
    submissions.map((submission) => ({
      ...submission,
      latitude: Number(submission.latitude.toString()),
      longitude: Number(submission.longitude.toString()),
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
      reviewedAt: submission.reviewedAt?.toISOString() ?? null
    }))
  );
}
