import { clearAdminSession } from "@/lib/auth";
import { jsonOk } from "@/lib/http";

export async function POST() {
  await clearAdminSession();
  return jsonOk({ ok: true });
}
