import { PrismaClient, StationStatus } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { z } from "zod";

for (const envFile of [".env.local", ".env"]) {
  if (existsSync(envFile)) {
    loadEnvFile(envFile);
  }
}

const defaultConnectionString = "postgresql://a97:a97@localhost:5432/a97_finder";

const args = process.argv.slice(2);
const inputIndex = args.findIndex((arg) => arg === "--input");
const inputPath = inputIndex >= 0 ? args[inputIndex + 1] : undefined;
const shouldApply = args.includes("--apply");
const shouldWriteSeedJson = args.includes("--write-seed-json");

if (!inputPath || (!shouldApply && !shouldWriteSeedJson)) {
  console.error(
    "Usage: yarn tsx scripts/import-stations.ts --input <file.{json|csv}> (--apply | --write-seed-json)"
  );
  process.exit(1);
}

const coordinate = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .min(min, `${label} is invalid`)
    .max(max, `${label} is invalid`);

const optionalText = z
  .union([z.string().trim().max(500), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return value;
  });

const seedStationSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(2).max(160),
  brand: optionalText,
  address: z.string().trim().min(5).max(260),
  ward: optionalText,
  district: optionalText,
  province: z.string().trim().min(2).max(120),
  latitude: coordinate("latitude", 8, 24),
  longitude: coordinate("longitude", 102, 110),
  notes: optionalText,
  source: z.string().trim().default("manual-import"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
});

type SeedStation = z.infer<typeof seedStationSchema>;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let value = "";
  let isQuoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
      if (isQuoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
        continue;
      }
      isQuoted = !isQuoted;
      continue;
    }

    if (char === "," && !isQuoted) {
      cells.push(value);
      value = "";
      continue;
    }

    value += char;
  }

  cells.push(value);
  return cells.map((cell) => cell.trim());
}

function loadStationsFromCsv(path: string): unknown[] {
  const raw = readFileSync(path, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const header = parseCsvLine(lines[0]).map((value) => value.trim());
  const results: Record<string, string>[] = [];

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const record: Record<string, string> = {};
    for (let i = 0; i < header.length; i += 1) {
      const key = header[i];
      if (key) {
        record[key] = cells[i] ?? "";
      }
    }
    results.push(record);
  }

  return results;
}

function loadInputStations(path: string) {
  const resolved = resolve(path);
  const extension = extname(resolved).toLowerCase();
  if (extension === ".json") {
    return JSON.parse(readFileSync(resolved, "utf8")) as unknown;
  }
  if (extension === ".csv") {
    return loadStationsFromCsv(resolved);
  }
  throw new Error("Unsupported input format. Use .json or .csv");
}

function normalizeStations(input: unknown): SeedStation[] {
  const array = z.array(z.unknown()).parse(input);
  return array.map((value) => seedStationSchema.parse(value));
}

const inputResolvedPath = resolve(inputPath);
const normalizedStations = normalizeStations(loadInputStations(inputResolvedPath));

if (shouldWriteSeedJson) {
  const seedPath = join(process.cwd(), "prisma", "seed-data", "a97-stations.json");
  writeFileSync(seedPath, `${JSON.stringify(normalizedStations, null, 2)}\n`, "utf8");
  console.log(`Wrote ${normalizedStations.length} stations to ${seedPath}`);
}

if (shouldApply) {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? defaultConnectionString
  });
  const prisma = new PrismaClient({ adapter });

  const inputDir = dirname(inputResolvedPath);
  console.log(`Importing ${normalizedStations.length} stations from ${inputDir}`);

  for (const station of normalizedStations) {
    const stationId = station.id ?? `import-${slugify(`${station.name}-${station.province}`)}`;
    await prisma.gasStation.upsert({
      where: { id: stationId },
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

  await prisma.$disconnect();
  console.log("Done");
}
