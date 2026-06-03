import { FIND_STATIONS_SKILL } from "@/lib/agent-discovery";

export function GET() {
  return new Response(FIND_STATIONS_SKILL, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8"
    }
  });
}
