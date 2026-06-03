import { NextRequest, NextResponse } from "next/server";
import { getLinkHeader, HOMEPAGE_MARKDOWN } from "@/lib/agent-discovery";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const linkHeader = getLinkHeader(request.url);
  const acceptsMarkdown = request.headers
    .get("accept")
    ?.split(",")
    .some((part) => part.trim().toLowerCase().startsWith("text/markdown"));

  if (acceptsMarkdown) {
    return new NextResponse(HOMEPAGE_MARKDOWN, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Link": linkHeader,
        "Vary": "Accept",
        "x-markdown-tokens": String(HOMEPAGE_MARKDOWN.split(/\s+/).filter(Boolean).length)
      }
    });
  }

  const response = NextResponse.next();
  response.headers.set("Link", linkHeader);
  response.headers.set("Vary", "Accept");
  return response;
}

export const config = {
  matcher: "/"
};
