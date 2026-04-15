/**
 * 简单的 OG 图像生成 API
 * 返回一张带文标题和日期的 PNG 图像，用于社交分享卡片
 * 使用现成的在线服务如 og-image 或返回占位图
 */

export default async function handler(req: any, res: any) {
  const { title = "Nicolette的blog", date = "" } = req.query;

  // 使用免费的 OG 图像生成服务（placeholder.com 或自建）
  // 这里返回一个简单的红色占位图，展示标题

  const encodedTitle = encodeURIComponent(title);
  const encodedDate = encodeURIComponent(date);

  // 方案 1：使用 Vercel 的官方 OG 图像库（需要 @vercel/og）
  // 方案 2：使用外部服务 og-image.vercel.app

  const ogImageUrl = `https://og-image.vercel.app/${encodedTitle}.png?theme=dark&md=0&fontSize=100px&images=https%3A%2F%2Fnicolletteblog.vercel.app%2Ffavicon.ico`;

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400");

  // 重定向到外部 OG 图像生成服务
  // 或者如果使用 @vercel/og，在这里生成图像

  res.redirect(ogImageUrl);
}
