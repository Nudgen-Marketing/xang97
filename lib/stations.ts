import { StationStatus } from "@/src/generated/prisma/client";
import { STATIONS_CACHE_KEY, STATIONS_CACHE_TTL_SECONDS } from "@/lib/constants";
import { getPrisma } from "@/lib/db";
import { deleteCache, getJsonCache, setJsonCache } from "@/lib/redis";

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

export async function listPublicStations() {
  const cached = await getJsonCache<PublicStation[]>(STATIONS_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const prisma = getPrisma();
  const stations = await prisma.gasStation.findMany({
    where: { status: StationStatus.ACTIVE },
    orderBy: [{ province: "asc" }, { name: "asc" }]
  });
  const publicStations = stations.map(toPublicStation);
  await setJsonCache(STATIONS_CACHE_KEY, publicStations, STATIONS_CACHE_TTL_SECONDS);
  return publicStations;
}

export async function invalidateStationsCache() {
  await deleteCache(STATIONS_CACHE_KEY);
}
