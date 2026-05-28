import { jsonError, jsonOk } from "@/lib/http";
import { setAdminSession, verifyAdminPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Thông tin đăng nhập không hợp lệ", 422);
  }

  const isValid = await verifyAdminPassword(parsed.data.username, parsed.data.password);
  if (!isValid) {
    return jsonError("Sai tài khoản hoặc mật khẩu", 401);
  }

  await setAdminSession();
  return jsonOk({ ok: true });
}
