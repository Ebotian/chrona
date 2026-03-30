#!/usr/bin/env python3
import argparse
import re
from collections import defaultdict
from pathlib import Path


HEADING_RE = re.compile(r"^\s{0,3}#{1,6}\s+(.*?)\s*$")


def extract_chinese_text(text: str) -> str:
	"""Keep only CJK Unified Ideographs and Extension A chars."""
	return "".join(
		ch
		for ch in text
		if ("\u4e00" <= ch <= "\u9fff") or ("\u3400" <= ch <= "\u4dbf")
	)


def iter_markdown_files(posts_dir: Path):
	for path in posts_dir.rglob("*"):
		if path.is_file() and path.suffix.lower() in {".md", ".markdown"}:
			yield path


def collect_titles(md_path: Path):
	titles = []

	# Use file stem as one title candidate.
	titles.append(md_path.stem)

	try:
		content = md_path.read_text(encoding="utf-8", errors="ignore")
	except OSError:
		return titles

	for line in content.splitlines():
		m = HEADING_RE.match(line)
		if m:
			titles.append(m.group(1).strip())

	return titles


def find_groups(posts_dir: Path, min_count: int):
	groups = defaultdict(list)

	for md_path in iter_markdown_files(posts_dir):
		rel = md_path.relative_to(posts_dir)
		for raw_title in collect_titles(md_path):
			normalized = extract_chinese_text(raw_title)
			if not normalized:
				continue
			groups[normalized].append((str(rel), raw_title))

	filtered = {k: v for k, v in groups.items() if len(v) >= min_count}
	return dict(sorted(filtered.items(), key=lambda kv: (-len(kv[1]), kv[0])))


def main():
	parser = argparse.ArgumentParser(
		description=(
			"Find repeated Chinese title families under posts/. "
			"A family is grouped by Chinese-only text after removing English letters and digits."
		)
	)
	parser.add_argument(
		"--posts",
		type=Path,
		default=Path("/home/ebit/chrona/posts"),
		help="Posts root directory (default: /home/ebit/chrona/posts)",
	)
	parser.add_argument(
		"--min-count",
		type=int,
		default=3,
		help="Minimum appearances for a title family to be included (default: 3)",
	)
	args = parser.parse_args()

	posts_dir = args.posts.resolve()
	if not posts_dir.exists() or not posts_dir.is_dir():
		raise SystemExit(f"Posts directory not found: {posts_dir}")

	groups = find_groups(posts_dir, args.min_count)

	if not groups:
		print("No Chinese title families matched the threshold.")
		return

	for family, items in groups.items():
		print(f"{family}\tcount={len(items)}")
		for rel_path, raw_title in items:
			print(f"  - {rel_path}: {raw_title}")
		print()


if __name__ == "__main__":
	main()
