import { SITE_NAME } from "@/lib/site-metadata";

export function GET() {
  const body = `# ${SITE_NAME} Agent Authentication

Public station search is available without authentication:

- \`GET /api/stations\`

Station suggestions can be submitted without an OAuth token and are moderated before publication:

- \`POST /api/submissions\`

Admin moderation APIs are not available for third-party agent registration. They use first-party session authentication for site operators only.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8"
    }
  });
}
