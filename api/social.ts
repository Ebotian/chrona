import fs from "fs";
import path from "path";

type PostData = {
  title: string;
  slug: string;
  body: string;
  date?: string;
};

function loadPost(slug: string): PostData | null {
  try {
    const postsDir = path.join(process.cwd(), "posts");

    function walkDir(dir: string): PostData | null {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const result = walkDir(fullPath);
          if (result) return result;
        } else if (entry.endsWith(".md")) {
          const content = fs.readFileSync(fullPath, "utf-8");
          const filename = entry.replace(/\.[^.]+$/, "");
          const fileSlug = filename
            .replace(/^[0-9]{4}([-.][0-9]{1,2}){2}[-_]?/, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          if (fileSlug === slug) {
            const title = filename.replace(
              /^[0-9]{4}([-.][0-9]{1,2}){2}[-_]?/,
              "",
            );
            const body = content;
            return { title, slug: fileSlug, body };
          }
        }
      }
      return null;
    }

    return walkDir(postsDir);
  } catch (e) {
    return null;
  }
}

function extractSummary(markdown: string, max = 160): string {
  let text = markdown;

  if (text.startsWith("---")) {
    const end = text.indexOf("---", 3);
    if (end !== -1) {
      text = text.slice(end + 3).trim();
    }
  }

  text = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/[*_~>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > max ? text.slice(0, max) + "…" : text;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 返回预渲染的 HTML for 爬虫，内含正确的 meta 标签
 * 用户点击时自动重定向到真实的 SPA 应用
 */
export default function handler(req: any, res: any) {
  const { slug } = req.query;

  if (!slug || typeof slug !== "string") {
    return res.status(404).json({ error: "Not found" });
  }

  const post = loadPost(slug);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const description = escapeHtml(
    extractSummary(post.body, 160) || "什么都写的博客",
  );
  const title = escapeHtml(post.title);
  const imageUrl = `https://nicoletteblog.vercel.app/api/og?title=${encodeURIComponent(
    post.title,
  )}&date=${post.date || ""}`;
  const canonicalUrl = `https://nicoletteblog.vercel.app/article/${slug}`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - Nicolette的blog</title>
  
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title} - Nicolette的blog" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Nicolette的blog" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title} - Nicolette的blog" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  
  <!-- Canonical 标签指向原始 URL -->
  <link rel="canonical" href="${canonicalUrl}" />
  
  <!-- 浏览器重定向到真实 SPA 应用 (延迟 2 秒给爬虫时间读取 meta) -->
  <meta http-equiv="refresh" content="2;url=${canonicalUrl}">
  <script>
    // 即时重定向（如果支持 JS）
    window.location.href = "${canonicalUrl}";
  </script>
</head>
<body>
  <p><a href="${canonicalUrl}">进入博客</a></p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.write(html);
  res.end();
}
