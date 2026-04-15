const SITE_TITLE = "Nicolette的blog";
const SITE_URL = "https://nicoletteblog.vercel.app";
const DEFAULT_DESCRIPTION = "什么都写的博客";

function clampText(value: string, maxLength: number): string {
  const text = value.trim();
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildSvg(params: {
  title: string;
  summary: string;
  site: string;
  favicon: string;
}): string {
  const { title, summary, site, favicon } = params;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#FFF8E1" />

  <g transform="translate(72 64)">
    <image href="${escapeXml(favicon)}" x="0" y="0" width="48" height="48" preserveAspectRatio="xMidYMid meet" />
    <text x="66" y="34" fill="#23324d" font-size="28" font-weight="700" font-family="Arial, Helvetica, sans-serif">${escapeXml(SITE_TITLE)}</text>
  </g>

  <g transform="translate(72 178)">
    <text fill="#23324d" font-size="66" font-weight="700" font-family="Arial, Helvetica, sans-serif">
      <tspan x="0" y="0">${escapeXml(title)}</tspan>
    </text>
    <text fill="#23324d" opacity="0.92" font-size="34" font-weight="500" font-family="Arial, Helvetica, sans-serif">
      <tspan x="0" y="104">${escapeXml(summary)}</tspan>
    </text>
  </g>

  <g transform="translate(72 556)">
    <circle cx="6" cy="6" r="6" fill="#23324d" />
    <text x="26" y="11" fill="#23324d" font-size="28" font-weight="600" font-family="Arial, Helvetica, sans-serif">${escapeXml(site)}</text>
  </g>
</svg>`;
}

export default function handler(req: Request): Response {
  const url = new URL(req.url);
  const title =
    clampText(url.searchParams.get("title") ?? SITE_TITLE, 48) || SITE_TITLE;
  const summary =
    clampText(url.searchParams.get("summary") ?? DEFAULT_DESCRIPTION, 100) ||
    DEFAULT_DESCRIPTION;
  const site = url.searchParams.get("site")?.trim() || SITE_URL;
  const favicon =
    url.searchParams.get("favicon")?.trim() || `${SITE_URL}/favicon.ico`;

  const svg = buildSvg({ title, summary, site, favicon });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
