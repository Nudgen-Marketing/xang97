import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-metadata";

export const HOMEPAGE_MARKDOWN = `# ${SITE_NAME}

${SITE_DESCRIPTION}

## Public Actions

- Search approved A97 gas stations with \`GET /api/stations\`.
- Submit a candidate station for moderation with \`POST /api/submissions\`.

## Notes For Agents

- Public search data is readable without authentication.
- New station submissions are moderated before public display.
- Admin moderation routes use first-party session authentication and are not advertised as public agent APIs.
`;

export const FIND_STATIONS_SKILL = `# Find A97 Stations

Use this skill when a user wants to find approved A97 gas stations in Vietnam.

## Endpoint

\`GET /api/stations\`

## Query Parameters

- \`page\`: positive integer page number.
- \`pageSize\`: number of results per page.
- \`lat\`, \`lng\`: optional user location coordinates.
- \`radiusKm\`: optional search radius when coordinates are supplied.

## Response

The endpoint returns a JSON envelope with \`success\` and paginated station data.
`;

export const SUBMIT_STATION_SKILL = `# Submit A97 Station

Use this skill when a user wants to suggest a missing A97 gas station.

## Endpoint

\`POST /api/submissions\`

## Required JSON Fields

- \`name\`
- \`address\`
- \`province\`
- \`latitude\`
- \`longitude\`

## Optional JSON Fields

\`brand\`, \`ward\`, \`district\`, \`notes\`, \`submitterName\`, \`submitterContact\`, \`photoUrl\`, and \`sourceUrl\`.

Submissions are moderated before they become public.
`;

export const AGENT_SKILLS = [
  {
    name: "find-a97-stations",
    type: "api",
    description: "Search approved A97 gas stations in Vietnam.",
    path: "/.well-known/agent-skills/find-a97-stations/SKILL.md",
    content: FIND_STATIONS_SKILL
  },
  {
    name: "submit-a97-station",
    type: "api",
    description: "Submit a candidate A97 gas station for moderator review.",
    path: "/.well-known/agent-skills/submit-a97-station/SKILL.md",
    content: SUBMIT_STATION_SKILL
  }
] as const;

export function getLinkHeader(requestUrl?: string) {
  const links = [
    ["api-catalog", "/.well-known/api-catalog", "application/linkset+json"],
    ["service-desc", "/.well-known/openapi.json", "application/vnd.oai.openapi+json;version=3.1"],
    ["service-doc", "/auth.md", "text/markdown"],
    ["mcp-server-card", "/.well-known/mcp/server-card.json", "application/json"],
    ["sitemap", "/sitemap.xml", "application/xml"]
  ];

  return links
    .map(
      ([rel, path, type]) =>
        `<${absoluteUrl(path, requestUrl)}>; rel="${rel}"; type="${type}"`
    )
    .join(", ");
}
