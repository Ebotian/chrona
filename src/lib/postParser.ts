import { promises as fs } from "fs";
import path from "path";

export interface ArticleMeta {
  id: string;
  title: string;
  date?: string;
  slug: string;
  filePath: string;
}

async function walkDir(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const ent of entries) {
    const res = path.join(dir, ent.name);
    if (ent.isDirectory()) files.push(...(await walkDir(res)));
    else if (ent.isFile() && res.endsWith(".md")) files.push(res);
  }
  return files;
}

function parseFrontmatter(content: string): Record<string, string> {
  const fm: Record<string, string> = {};
  if (!content.startsWith("---")) return fm;
  const end = content.indexOf("---", 3);
  if (end === -1) return fm;
  const body = content.slice(3, end).trim();
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      fm[m[1]] = val;
    }
  }
  return fm;
}


function filenameToSlug(file: string): string {
  const base = path.basename(file, path.extname(file));
  // remove leading date like 2023-05-01-xxx or 2023.05.01_xxx
  const stripped = base.replace(/^[0-9]{4}([-.][0-9]{1,2}){2}[-_]?/, "");
  return stripped
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function filenameDate(file: string): string | undefined {
  const base = path.basename(file);
  const m = base.match(/(\d{4}[-.]\d{1,2}[-.]\d{1,2})/);
  return m ? m[1].replace(/\./g, "-") : undefined;
}

export async function loadPosts(postsDir: string): Promise<ArticleMeta[]> {
  const abs = path.resolve(postsDir);
  const files = await walkDir(abs);
  const results: ArticleMeta[] = [];
  for (const f of files) {
    try {
      const raw = await fs.readFile(f, "utf8");
      const fm = parseFrontmatter(raw);
      const rawName = path.basename(f, path.extname(f));
      // title is the filename (with leading date prefix removed)
      const title = rawName.replace(/^[0-9]{4}([-.][0-9]{1,2}){2}[-_]?/, "");
      const date = fm.date || filenameDate(f);
      const slug = (fm.slug || filenameToSlug(f));
      const id = slug;
      results.push({ id, title, date, slug, filePath: path.relative(process.cwd(), f) });
    } catch (err) {
      // skip unreadable file
    }
  }
  // sort by date desc when available, else by slug
  results.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.slug.localeCompare(b.slug);
  });
  return results;
}

export default loadPosts;
