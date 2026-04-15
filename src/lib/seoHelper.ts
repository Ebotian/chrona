/**
 * SEO 助手函数：动态更新元标签用于社交分享（OG、Twitter Card）
 */

interface SEOConfig {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: string;
}

function updateMetaTag(
  property: string,
  content: string,
  isProperty = true,
): void {
  const selector = isProperty
    ? `meta[property="${property}"]`
    : `meta[name="${property}"]`;
  let tag = document.querySelector(selector) as HTMLMetaElement | null;

  if (!tag) {
    tag = document.createElement("meta");
    const attrName = isProperty ? "property" : "name";
    tag.setAttribute(attrName, property);
    document.head.appendChild(tag);
  }

  tag.content = content;
}

export function updatePageSEO(config: SEOConfig): void {
  const { title, description, url, image, type = "article" } = config;

  // 更新页面标题
  document.title = title;

  // 更新 Open Graph 标签
  updateMetaTag("og:type", type);
  updateMetaTag("og:title", title);
  updateMetaTag("og:description", description);
  updateMetaTag("og:url", url);

  if (image) {
    updateMetaTag("og:image", image);
  }

  // 更新 Twitter Card 标签
  updateMetaTag("twitter:title", title, false);
  updateMetaTag("twitter:description", description, false);

  if (image) {
    updateMetaTag("twitter:image", image, false);
  }
}

export function resetPageSEO(): void {
  updatePageSEO({
    title: "Nicolette的blog",
    description: "什么都写的博客",
    url: "https://nicoletteblog.vercel.app",
    image: "https://nicoletteblog.vercel.app/favicon.ico",
  });
}

/**
 * 从 Markdown 内容中提取摘要（去除格式，取前 160 个字符）
 */
export function extractSummary(markdown: string, maxLength = 160): string {
  if (!markdown) return "";

  // 去掉 frontmatter
  let content = markdown;
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);
    if (end !== -1) {
      content = content.slice(end + 3).trim();
    }
  }

  // 移除代码块和行内代码
  content = content.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");

  // 移除 Markdown 标记
  content = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // 图片
    .replace(/\[[^\]]*\]\([^)]*\)/g, "") // 链接
    .replace(/^#+\s*/gm, "") // 标题符号
    .replace(/[*_~>#-]/g, " ") // 其他 Markdown 符号
    .replace(/\s+/g, " ") // 多空格合并
    .trim();

  // 截断到指定长度
  if (content.length > maxLength) {
    return content.slice(0, maxLength).trim() + "…";
  }

  return content;
}
