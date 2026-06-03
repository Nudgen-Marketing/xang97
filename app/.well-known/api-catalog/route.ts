import { absoluteUrl } from "@/lib/site-metadata";

export function GET(request: Request) {
  const body = {
    linkset: [
      {
        anchor: absoluteUrl("/api/stations", request.url),
        "service-desc": [
          {
            href: absoluteUrl("/.well-known/openapi.json", request.url),
            type: "application/vnd.oai.openapi+json;version=3.1"
          }
        ],
        "service-doc": [
          {
            href: absoluteUrl("/auth.md", request.url),
            type: "text/markdown"
          }
        ],
        status: [
          {
            href: absoluteUrl("/api/health", request.url),
            type: "application/json"
          }
        ]
      },
      {
        anchor: absoluteUrl("/api/submissions", request.url),
        "service-desc": [
          {
            href: absoluteUrl("/.well-known/openapi.json", request.url),
            type: "application/vnd.oai.openapi+json;version=3.1"
          }
        ],
        "service-doc": [
          {
            href: absoluteUrl("/auth.md", request.url),
            type: "text/markdown"
          }
        ],
        status: [
          {
            href: absoluteUrl("/api/health", request.url),
            type: "application/json"
          }
        ]
      }
    ]
  };

  return Response.json(body, {
    headers: {
      "Content-Type": "application/linkset+json; charset=utf-8"
    }
  });
}
