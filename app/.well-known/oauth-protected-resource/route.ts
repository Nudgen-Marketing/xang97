import { absoluteUrl, SITE_NAME } from "@/lib/site-metadata";

export function GET(request: Request) {
  return Response.json(
    {
      resource: absoluteUrl("/", request.url),
      name: SITE_NAME,
      authorization_servers: [],
      scopes_supported: ["public:read", "public:submit"],
      bearer_methods_supported: [],
      note: "Public station search and station submissions do not require OAuth. Admin APIs are first-party only and are not available for third-party agent registration."
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}
