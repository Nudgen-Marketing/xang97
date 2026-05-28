import { getPrisma } from "@/lib/db";
import { formatZodError, jsonError, jsonOk } from "@/lib/http";
import { stationSubmissionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = stationSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Dữ liệu gửi lên không hợp lệ", 422, formatZodError(parsed.error));
  }

  try {
    const prisma = getPrisma();
    const submission = await prisma.gasStationSubmission.create({
      data: parsed.data
    });

    return jsonOk({ id: submission.id, status: submission.status }, 201);
  } catch {
    return jsonError("Không thể lưu đề xuất lúc này", 500);
  }
}
