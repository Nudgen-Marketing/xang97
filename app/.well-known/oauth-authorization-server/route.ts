import { absoluteUrl, SITE_NAME } from "@/lib/site-metadata";

export function GET(request: Request) {
  return Response.json(
    {
      issuer: absoluteUrl("/", request.url).replace(/\/$/, ""),
      service_documentation: absoluteUrl("/auth.md", request.url),
      grant_types_supported: [],
      scopes_supported: ["public:read", "public:submit"],
      agent_auth: {
        register_uri: absoluteUrl("/auth.md", request.url),
        supported_identity_types: [],
        supported_credential_types: [],
        note: `${SITE_NAME} does not currently offer OAuth-based third-party agent registration.`
      }
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}
