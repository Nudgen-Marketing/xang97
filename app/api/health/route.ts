import { jsonOk } from "@/lib/http";

export function GET() {
  return jsonOk({
    status: "ok"
  });
}
