export const SITE_NAME = "Tra cứu cây xăng A97";

export const SITE_DESCRIPTION =
  "Tìm và đóng góp vị trí cây xăng bán A97 tại Việt Nam.";

export function getSiteUrl(requestUrl?: string) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (configuredUrl) {
    return normalizeOrigin(configuredUrl);
  }

  if (requestUrl) {
    return new URL(requestUrl).origin;
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path: string, requestUrl?: string) {
  return new URL(path, getSiteUrl(requestUrl)).toString();
}

function normalizeOrigin(value: string) {
  const withProtocol = value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;

  return new URL(withProtocol).origin;
}
