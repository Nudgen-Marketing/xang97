import { absoluteUrl, SITE_NAME } from "@/lib/site-metadata";

export function GET(request: Request) {
  return Response.json(
    {
      schemaVersion: "0.1",
      serverInfo: {
        name: SITE_NAME,
        version: "1.0.0"
      },
      transports: [
        {
          type: "webmcp",
          endpoint: absoluteUrl("/", request.url)
        }
      ],
      capabilities: {
        tools: [
          {
            name: "find_a97_stations",
            description: "Search approved A97 gas stations in Vietnam."
          },
          {
            name: "submit_a97_station",
            description: "Submit a candidate A97 gas station for review."
          }
        ]
      }
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}
