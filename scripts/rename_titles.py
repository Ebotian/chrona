#!/usr/bin/env python3
import argparse
import re
from pathlib import Path


CN_NUM = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '百': 100,
}


def chinese_to_int(s: str) -> int | None:
    s = s.strip()
    if not s:
        return None
    if s.isdigit():
        try:
            return int(s)
        except ValueError:
            return None

    # naive parser for numbers up to a few hundreds (handles 常见写法)
    total = 0
    if s == '十':
        return 10
    if '百' in s:
        parts = s.split('百')
        hundreds = CN_NUM.get(parts[0], 0) if parts[0] else 1
        total += hundreds * 100
        s = parts[1] if len(parts) > 1 else ''
    if '十' in s:
        parts = s.split('十')
        tens = CN_NUM.get(parts[0], 0) if parts[0] else 1
        total += tens * 10
        s = parts[1] if len(parts) > 1 else ''
    if s:
        total += CN_NUM.get(s, 0)
    return total if total != 0 else None


def find_matches(name: str):
    # Try multiple patterns; return tuple(kind, book, page) or (kind, page) for high
    name = name.replace(' ', '')

    patterns = [
        # keep numeric groups as strings to preserve leading zeros
        (re.compile(r'大学随笔第(\d+)本(\d+)页'), lambda m: ('uni', m.group(1), m.group(2))),
        (re.compile(r'大学随笔第([一二三四五六七八九十百零]+)本([0-9]+)页'), lambda m: ('uni', str(chinese_to_int(m.group(1))) if chinese_to_int(m.group(1)) is not None else None, m.group(2))),
        (re.compile(r'高中随笔第(\d+)页'), lambda m: ('high', m.group(1))),
        (re.compile(r'高中随笔第([一二三四五六七八九十百零]+)页'), lambda m: ('high', str(chinese_to_int(m.group(1))) if chinese_to_int(m.group(1)) is not None else None)),
        (re.compile(r'第(\d+)本(\d+)页'), lambda m: ('uni', m.group(1), m.group(2))),
        (re.compile(r'第([一二三四五六七八九十百零]+)本([0-9]+)页'), lambda m: ('uni', str(chinese_to_int(m.group(1))) if chinese_to_int(m.group(1)) is not None else None, m.group(2))),
    ]

    for regex, handler in patterns:
        m = regex.search(name)
        if m:
            return handler(m)
    return None


def preview_and_apply(posts_dir: Path, apply: bool):
    posts_dir = posts_dir.resolve()
    mappings = []
    for p in posts_dir.rglob('*'):
        if not p.is_file() or p.suffix.lower() not in {'.md', '.markdown'}:
            continue
        stem = p.stem
        m = find_matches(stem)
        if not m:
            continue
        if m[0] == 'uni':
            _, book, page = m
            if book is None or page is None:
                continue
            new_name = f"uni-{book}-{page}p{p.suffix}"
        else:
            _, page = m
            if page is None:
                continue
            new_name = f"high-{page}p{p.suffix}"

        target = p.with_name(new_name)
        mappings.append((p, target))

    if not mappings:
        print('No matching files found.')
        return 0

    # print preview
    for src, dst in mappings:
        print(f"{src.relative_to(posts_dir)} -> {dst.relative_to(posts_dir)}")

    if not apply:
        print('\nDry run only. Use --apply to actually rename files.')
        return 0

    # apply renames safely
    conflicts = []
    for src, dst in mappings:
        if dst.exists():
            conflicts.append((src, dst))
            print(f"SKIP (target exists): {dst}")
            continue
        try:
            src.rename(dst)
            print(f"RENAMED: {src} -> {dst}")
        except Exception as e:
            conflicts.append((src, dst))
            print(f"FAILED: {src} -> {dst}: {e}")

    if conflicts:
        print('\nSome files were not renamed due to conflicts or errors.')
    else:
        print('\nAll done.')

    return 0


def main():
    parser = argparse.ArgumentParser(description='Batch-rename posts like 大学随笔第X本Y页 -> uni-X-Yp')
    parser.add_argument('--posts', type=Path, default=Path('/home/ebit/chrona/posts'))
    parser.add_argument('--apply', action='store_true', help='Actually perform renames; default is dry-run')
    args = parser.parse_args()

    if not args.posts.exists() or not args.posts.is_dir():
        raise SystemExit(f'Posts directory not found: {args.posts}')

    raise SystemExit(preview_and_apply(args.posts, args.apply))


if __name__ == '__main__':
    main()
