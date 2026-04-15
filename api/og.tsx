import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

const SITE_TITLE = "Nicolette的blog";
const SITE_URL = "https://nicoletteblog.vercel.app";
const DEFAULT_DESCRIPTION = "什么都写的博客";

function clampText(value: string, maxLength: number): string {
  const text = value.trim();
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const title =
    clampText(url.searchParams.get("title") ?? SITE_TITLE, 48) || SITE_TITLE;
  const summary =
    clampText(url.searchParams.get("summary") ?? DEFAULT_DESCRIPTION, 100) ||
    DEFAULT_DESCRIPTION;
  const site = url.searchParams.get("site")?.trim() || SITE_URL;
  const favicon =
    url.searchParams.get("favicon")?.trim() || `${SITE_URL}/favicon.ico`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#FFF8E1",
        color: "#23324d",
        padding: "64px 72px",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <img
          src={favicon}
          alt="favicon"
          width={48}
          height={48}
          style={{ width: "48px", height: "48px", objectFit: "contain" }}
        />
        <span
          style={{
            fontSize: "28px",
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {SITE_TITLE}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          maxWidth: "1050px",
        }}
      >
        <div
          style={{
            fontSize: "66px",
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "34px",
            fontWeight: 500,
            lineHeight: 1.45,
            opacity: 0.92,
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {summary}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "999px",
            background: "#23324d",
            display: "flex",
          }}
        />
        <span style={{ fontSize: "28px", fontWeight: 600, lineHeight: 1 }}>
          {site}
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
