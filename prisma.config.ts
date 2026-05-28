import { defineConfig } from "prisma/config";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

for (const envFile of [".env.local", ".env"]) {
  if (existsSync(envFile)) {
    loadEnvFile(envFile);
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://a97:a97@localhost:5432/a97_finder"
  }
});
