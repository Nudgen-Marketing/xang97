import { redirect } from "next/navigation";
import { SubmissionStatus } from "@/src/generated/prisma/client";
import { AdminDashboard } from "@/components/AdminDashboard";
import { requireAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export default async function AdminPage() {
  if (!(await requireAdmin())) {
    redirect("/admin/login");
  }

  const prisma = getPrisma();
  const [submissions, stations] = await Promise.all([
    prisma.gasStationSubmission.findMany({
      where: { status: SubmissionStatus.PENDING },
      orderBy: { createdAt: "asc" }
    }),
    prisma.gasStation.findMany({
      orderBy: [{ status: "asc" }, { province: "asc" }, { name: "asc" }],
      take: 200
    })
  ]);

  return (
    <AdminDashboard
      submissions={submissions.map((submission) => ({
        ...submission,
        latitude: Number(submission.latitude.toString()),
        longitude: Number(submission.longitude.toString()),
        createdAt: submission.createdAt.toISOString(),
        updatedAt: submission.updatedAt.toISOString(),
        reviewedAt: submission.reviewedAt?.toISOString() ?? null
      }))}
      stations={stations.map((station) => ({
        ...station,
        latitude: Number(station.latitude.toString()),
        longitude: Number(station.longitude.toString()),
        createdAt: station.createdAt.toISOString(),
        updatedAt: station.updatedAt.toISOString(),
        lastVerifiedAt: station.lastVerifiedAt?.toISOString() ?? null
      }))}
    />
  );
}
