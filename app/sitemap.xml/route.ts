import { absoluteUrl } from "@/lib/site-metadata";

const SITEMAP_PATHS = ["/", "/auth.md", "/.well-known/api-catalog"] as const;

export function GET(request: Request) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = SITEMAP_PATHS.map(
    (path) => `  <url>
    <loc>${absoluteUrl(path, request.url)}</loc>
    <lastmod>${today}</lastmod>
  </url>`
  ).join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
