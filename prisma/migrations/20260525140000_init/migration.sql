CREATE TYPE "StationStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "GasStation" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT,
  "address" TEXT NOT NULL,
  "ward" TEXT,
  "district" TEXT,
  "province" TEXT NOT NULL,
  "latitude" DECIMAL(9,6) NOT NULL,
  "longitude" DECIMAL(9,6) NOT NULL,
  "notes" TEXT,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "status" "StationStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GasStation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GasStationSubmission" (
  "id" TEXT NOT NULL,
  "stationId" TEXT,
  "name" TEXT NOT NULL,
  "brand" TEXT,
  "address" TEXT NOT NULL,
  "ward" TEXT,
  "district" TEXT,
  "province" TEXT NOT NULL,
  "latitude" DECIMAL(9,6) NOT NULL,
  "longitude" DECIMAL(9,6) NOT NULL,
  "notes" TEXT,
  "submitterName" TEXT,
  "submitterContact" TEXT,
  "photoUrl" TEXT,
  "sourceUrl" TEXT,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "moderationNotes" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GasStationSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GasStation_status_idx" ON "GasStation"("status");
CREATE INDEX "GasStation_province_idx" ON "GasStation"("province");
CREATE INDEX "GasStation_latitude_longitude_idx" ON "GasStation"("latitude", "longitude");
CREATE INDEX "GasStationSubmission_status_idx" ON "GasStationSubmission"("status");
CREATE INDEX "GasStationSubmission_province_idx" ON "GasStationSubmission"("province");
CREATE INDEX "GasStationSubmission_createdAt_idx" ON "GasStationSubmission"("createdAt");

ALTER TABLE "GasStationSubmission"
  ADD CONSTRAINT "GasStationSubmission_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "GasStation"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
