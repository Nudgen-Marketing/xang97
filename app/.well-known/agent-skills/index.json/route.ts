import { createHash } from "node:crypto";
import { AGENT_SKILLS } from "@/lib/agent-discovery";
import { absoluteUrl } from "@/lib/site-metadata";

function sha256Digest(content: string) {
  return `sha256:${createHash("sha256").update(content, "utf8").digest("hex")}`;
}

export function GET(request: Request) {
  return Response.json(
    {
      $schema: "https://agentskills.io/schema/agent-skills-index-v0.2.json",
      skills: AGENT_SKILLS.map((skill) => ({
        name: skill.name,
        type: skill.type,
        description: skill.description,
        url: absoluteUrl(skill.path, request.url),
        sha256: sha256Digest(skill.content)
      }))
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}
