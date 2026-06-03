import { redirect } from "next/navigation";
import { SubmissionStatus } from "@/src/generated/prisma/client";
import { AdminDashboard } from "@/components/AdminDashboard";
import { requireAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { getPaginationState } from "@/lib/pagination";

const PENDING_PAGE_SIZE = 10;
const STATION_PAGE_SIZE = 25;

type AdminPageProps = {
  searchParams?: Promise<{
    page?: string | string[];
    stationPage?: string | string[];
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  if (!(await requireAdmin())) {
    redirect("/admin/login");
  }

  const prisma = getPrisma();
  const resolvedSearchParams = (await searchParams) ?? {};
  const [pendingCount, stationCount] = await Promise.all([
    prisma.gasStationSubmission.count({
      where: { status: SubmissionStatus.PENDING }
    }),
    prisma.gasStation.count()
  ]);
  const pendingPagination = getPaginationState({
    requestedPage: resolvedSearchParams.page,
    pageSize: PENDING_PAGE_SIZE,
    totalCount: pendingCount
  });
  const stationPagination = getPaginationState({
    requestedPage: resolvedSearchParams.stationPage,
    pageSize: STATION_PAGE_SIZE,
    totalCount: stationCount
  });
  const [submissions, stations] = await Promise.all([
    prisma.gasStationSubmission.findMany({
      where: { status: SubmissionStatus.PENDING },
      orderBy: { createdAt: "asc" },
      skip: pendingPagination.skip,
      take: pendingPagination.pageSize
    }),
    prisma.gasStation.findMany({
      orderBy: [{ status: "asc" }, { province: "asc" }, { name: "asc" }],
      skip: stationPagination.skip,
      take: stationPagination.pageSize
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
      pendingPagination={pendingPagination}
      stationPagination={stationPagination}
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
