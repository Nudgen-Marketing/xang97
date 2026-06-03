import { Prisma, StationStatus } from "@/src/generated/prisma/client";
import { STATIONS_CACHE_KEY } from "@/lib/constants";
import { getPrisma } from "@/lib/db";
import { getPaginationState, toPaginatedResult, type PaginatedResult } from "@/lib/pagination";
import { deleteCache } from "@/lib/redis";
import type { StationSearchOptions } from "@/lib/station-search";

export type PublicStation = {
  id: string;
  name: string;
  brand: string | null;
  address: string;
  ward: string | null;
  district: string | null;
  province: string;
  latitude: number;
  longitude: number;
  notes: string | null;
  source: string;
  lastVerifiedAt: string | null;
  updatedAt: string;
};

export type PublicStationWithDistance = PublicStation & {
  distanceKm?: number;
};

function toPublicStation(station: {
  id: string;
  name: string;
  brand: string | null;
  address: string;
  ward: string | null;
  district: string | null;
  province: string;
  latitude: { toString(): string };
  longitude: { toString(): string };
  notes: string | null;
  source: string;
  lastVerifiedAt: Date | null;
  updatedAt: Date;
}): PublicStation {
  return {
    ...station,
    latitude: Number(station.latitude.toString()),
    longitude: Number(station.longitude.toString()),
    lastVerifiedAt: station.lastVerifiedAt?.toISOString() ?? null,
    updatedAt: station.updatedAt.toISOString()
  };
}

function toPublicStationWithDistance(
  station: Parameters<typeof toPublicStation>[0] & { distanceKm?: number | string | null }
): PublicStationWithDistance {
  return {
    ...toPublicStation(station),
    ...(station.distanceKm === undefined || station.distanceKm === null
      ? {}
      : { distanceKm: Number(station.distanceKm) })
  };
}

function buildTextSearchWhere(query?: string | null): Prisma.GasStationWhereInput {
  const normalizedQuery = query?.trim();
  if (!normalizedQuery) {
    return {};
  }

  return {
    OR: [
      { name: { contains: normalizedQuery, mode: "insensitive" } },
      { brand: { contains: normalizedQuery, mode: "insensitive" } },
      { address: { contains: normalizedQuery, mode: "insensitive" } },
      { ward: { contains: normalizedQuery, mode: "insensitive" } },
      { district: { contains: normalizedQuery, mode: "insensitive" } },
      { province: { contains: normalizedQuery, mode: "insensitive" } }
    ]
  };
}

function buildRawTextSearchWhere(query?: string | null) {
  const normalizedQuery = query?.trim();
  if (!normalizedQuery) {
    return Prisma.empty;
  }

  const pattern = `%${normalizedQuery}%`;
  return Prisma.sql`
    AND (
      "name" ILIKE ${pattern}
      OR COALESCE("brand", '') ILIKE ${pattern}
      OR "address" ILIKE ${pattern}
      OR COALESCE("ward", '') ILIKE ${pattern}
      OR COALESCE("district", '') ILIKE ${pattern}
      OR "province" ILIKE ${pattern}
    )
  `;
}

function buildDistanceExpression(latitude: number, longitude: number) {
  return Prisma.sql`
    6371 * acos(
      LEAST(
        1,
        GREATEST(
          -1,
          cos(radians(${latitude})) * cos(radians("latitude"::double precision)) *
          cos(radians("longitude"::double precision) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians("latitude"::double precision))
        )
      )
    )
  `;
}

export async function listPublicStations({
  search,
  page,
  pageSize
}: {
  search: StationSearchOptions;
  page?: unknown;
  pageSize?: unknown;
}): Promise<PaginatedResult<PublicStationWithDistance>> {
  const prisma = getPrisma();
  const where = {
    status: StationStatus.ACTIVE,
    ...buildTextSearchWhere(search.query)
  };

  if (search.origin) {
    const rawTextSearchWhere = buildRawTextSearchWhere(search.query);
    const distanceExpression = buildDistanceExpression(
      search.origin.latitude,
      search.origin.longitude
    );
    const radiusWhere =
      search.radiusKm && search.radiusKm > 0
        ? Prisma.sql`AND "distanceKm" <= ${search.radiusKm}`
        : Prisma.empty;
    const countRows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS "count"
      FROM (
        SELECT ${distanceExpression} AS "distanceKm"
        FROM "GasStation"
        WHERE "status" = ${StationStatus.ACTIVE}::"StationStatus"
        ${rawTextSearchWhere}
      ) AS filtered_stations
      WHERE TRUE
      ${radiusWhere}
    `;
    const pagination = getPaginationState({
      requestedPage: page,
      requestedPageSize: pageSize,
      totalCount: Number(countRows[0]?.count ?? 0)
    });
    const stations = await prisma.$queryRaw<
      Array<Parameters<typeof toPublicStation>[0] & { distanceKm: number | string }>
    >`
      SELECT *
      FROM (
        SELECT
          "id",
          "name",
          "brand",
          "address",
          "ward",
          "district",
          "province",
          "latitude",
          "longitude",
          "notes",
          "source",
          "lastVerifiedAt",
          "updatedAt",
          ${distanceExpression} AS "distanceKm"
        FROM "GasStation"
        WHERE "status" = ${StationStatus.ACTIVE}::"StationStatus"
        ${rawTextSearchWhere}
      ) AS filtered_stations
      WHERE TRUE
      ${radiusWhere}
      ORDER BY "distanceKm" ASC, "province" ASC, "name" ASC
      LIMIT ${pagination.pageSize}
      OFFSET ${pagination.skip}
    `;

    return toPaginatedResult(stations.map(toPublicStationWithDistance), pagination);
  }

  const totalCount = await prisma.gasStation.count({ where });
  const pagination = getPaginationState({
    requestedPage: page,
    requestedPageSize: pageSize,
    totalCount
  });
  const stations = await prisma.gasStation.findMany({
    where,
    orderBy: [{ province: "asc" }, { name: "asc" }],
    skip: pagination.skip,
    take: pagination.pageSize
  });

  return toPaginatedResult(stations.map(toPublicStation), pagination);
}

export async function invalidateStationsCache() {
  await deleteCache(STATIONS_CACHE_KEY);
}
