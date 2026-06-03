import { SUBMIT_STATION_SKILL } from "@/lib/agent-discovery";

export function GET() {
  return new Response(SUBMIT_STATION_SKILL, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8"
    }
  });
}
