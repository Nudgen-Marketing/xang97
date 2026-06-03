import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-metadata";

export function GET(request: Request) {
  const body = {
    openapi: "3.1.0",
    info: {
      title: `${SITE_NAME} API`,
      version: "1.0.0",
      description: SITE_DESCRIPTION
    },
    servers: [
      {
        url: absoluteUrl("/", request.url).replace(/\/$/, "")
      }
    ],
    paths: {
      "/api/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": {
              description: "Service status"
            }
          }
        }
      },
      "/api/stations": {
        get: {
          summary: "List approved A97 stations",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
            { name: "lat", in: "query", schema: { type: "number", minimum: 8, maximum: 24 } },
            { name: "lng", in: "query", schema: { type: "number", minimum: 102, maximum: 110 } },
            { name: "radiusKm", in: "query", schema: { type: "number", minimum: 1, maximum: 500 } }
          ],
          responses: {
            "200": {
              description: "Paginated station results"
            },
            "500": {
              description: "Station search failed"
            }
          }
        }
      },
      "/api/submissions": {
        post: {
          summary: "Submit a candidate A97 station for review",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "address", "province", "latitude", "longitude"],
                  properties: {
                    name: { type: "string", minLength: 2, maxLength: 160 },
                    brand: { type: "string", maxLength: 500 },
                    address: { type: "string", minLength: 5, maxLength: 260 },
                    ward: { type: "string", maxLength: 500 },
                    district: { type: "string", maxLength: 500 },
                    province: { type: "string", minLength: 2, maxLength: 120 },
                    latitude: { type: "number", minimum: 8, maximum: 24 },
                    longitude: { type: "number", minimum: 102, maximum: 110 },
                    notes: { type: "string", maxLength: 500 },
                    submitterName: { type: "string", maxLength: 500 },
                    submitterContact: { type: "string", maxLength: 500 },
                    photoUrl: { type: "string", format: "uri", maxLength: 500 },
                    sourceUrl: { type: "string", format: "uri", maxLength: 500 }
                  }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Submission accepted for moderation"
            },
            "422": {
              description: "Invalid submission"
            },
            "500": {
              description: "Submission failed"
            }
          }
        }
      }
    }
  };

  return Response.json(body, {
    headers: {
      "Content-Type": "application/vnd.oai.openapi+json;version=3.1; charset=utf-8"
    }
  });
}
