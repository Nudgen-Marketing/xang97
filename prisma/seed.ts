import { PrismaClient, StationStatus } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvFile } from "node:process";
import { z } from "zod";

for (const envFile of [".env.local", ".env"]) {
  if (existsSync(envFile)) {
    loadEnvFile(envFile);
  }
}

const defaultConnectionString = "postgresql://a97:a97@localhost:5432/a97_finder";

const seedStationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  brand: z.string().optional().nullable(),
  address: z.string().min(5),
  ward: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  province: z.string().min(2),
  latitude: z.number().min(8).max(24),
  longitude: z.number().min(102).max(110),
  notes: z.string().optional().nullable(),
  source: z.string().default("manual-image-transcription"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
});

const seedStationsSchema = z.array(seedStationSchema);

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadSeedStations() {
  const seedPath = join(process.cwd(), "prisma", "seed-data", "a97-stations.json");
  const raw = readFileSync(seedPath, "utf8");
  return seedStationsSchema.parse(JSON.parse(raw));
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? defaultConnectionString
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const seedStations = loadSeedStations();

  for (const station of seedStations) {
    const stationId = station.id ?? `seed-${slugify(`${station.name}-${station.province}`)}`;

    await prisma.gasStation.upsert({
      where: {
        id: stationId
      },
      update: {
        ...station,
        status: StationStatus[station.status]
      },
      create: {
        id: stationId,
        ...station,
        status: StationStatus[station.status]
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
