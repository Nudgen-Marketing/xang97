import { absoluteUrl } from "@/lib/site-metadata";

export function GET(request: Request) {
  const sitemapUrl = absoluteUrl("/sitemap.xml", request.url);
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/admin/",
    "",
    "User-agent: GPTBot",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/admin/",
    "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/admin/",
    "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    "",
    "User-agent: Claude-Web",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/admin/",
    "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    "",
    "User-agent: Google-Extended",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/admin/",
    "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    "",
    `Sitemap: ${sitemapUrl}`,
    ""
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
