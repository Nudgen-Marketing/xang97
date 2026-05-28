import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/src/generated/prisma/client";

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));
}

export function handleRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return jsonError("Không tìm thấy dữ liệu cần thao tác", 404);
  }

  return jsonError(fallbackMessage, 500);
}
