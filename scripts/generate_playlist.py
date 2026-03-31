#!/usr/bin/env python3
"""
Generate a playlist JSON from the project's music folder.

- Scans the `music/` directory for audio files.
- Looks for cover images in `music/album/` named after the track, or common cover names in the same folder.
- Writes `src/playlist.json` with items: { src: "/music/rel/path", cover: "/music/album/cover.jpg" }

Usage:
  python scripts/generate_playlist.py
  python scripts/generate_playlist.py --music ./music --out src/playlist.json
"""

from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
from typing import List, Optional

AUDIO_EXTS = {'.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac'}
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
COMMON_COVER_NAMES = ('cover', 'album', 'folder')


def find_cover_for(basename: str, file_dir: Path, music_dir: Path) -> Optional[str]:
    """Find a cover image for an audio file.

    Priority:
    1. music/album/<basename>.<ext>
    2. same directory: cover.*, album.*, folder.*
    3. same directory: <basename>.<ext>
    Returns web-style path starting with /music/..., or None.
    """
    album_dir = music_dir / 'album'
    # 1) check music/album/<basename>
    for ext in IMAGE_EXTS:
        p = album_dir / (basename + ext)
        if p.is_file():
            return '/music/album/' + p.name

    # 2) common names in same dir
    for name in COMMON_COVER_NAMES:
        for ext in IMAGE_EXTS:
            p = file_dir / (name + ext)
            if p.is_file():
                rel = p.relative_to(music_dir).as_posix()
                return '/music/' + rel

    # 3) file-specific image in same dir
    for ext in IMAGE_EXTS:
        p = file_dir / (basename + ext)
        if p.is_file():
            rel = p.relative_to(music_dir).as_posix()
            return '/music/' + rel

    return None


def collect_playlist(music_dir: Path) -> List[dict]:
    items = []
    # walk music_dir, skip the album directory when scanning audio files
    for root, dirs, files in os.walk(music_dir):
        # skip album folder contents for audio collection
        relroot = Path(root).relative_to(music_dir)
        if len(relroot.parts) > 0 and relroot.parts[0] == 'album':
            continue
        for fname in sorted(files):
            p = Path(root) / fname
            if p.suffix.lower() in AUDIO_EXTS:
                rel = p.relative_to(music_dir).as_posix()
                src = '/music/' + rel
                basename = p.stem
                cover = find_cover_for(basename, p.parent, music_dir)
                items.append({'src': src, 'cover': cover or ''})
    return items


def main(argv: List[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description='Generate playlist JSON from music folder')
    ap.add_argument('--music', '-m', default='music', help='path to music directory (default: music)')
    ap.add_argument('--out', '-o', default='src/assets/playlist.json', help='output JSON file (default: src/assets/playlist.json)')
    ap.add_argument('--root', '-r', default='.', help='project root (default: current dir)')
    args = ap.parse_args(argv)

    project_root = Path(args.root).resolve()
    music_dir = (project_root / args.music).resolve()
    out_file = (project_root / args.out).resolve()

    if not music_dir.exists() or not music_dir.is_dir():
        print(f'Error: music directory not found: {music_dir}', flush=True)
        return 2

    playlist = collect_playlist(music_dir)

    out_file.parent.mkdir(parents=True, exist_ok=True)
    with out_file.open('w', encoding='utf-8') as f:
        json.dump(playlist, f, ensure_ascii=False, indent=2)

    print(f'Wrote {len(playlist)} tracks to {out_file}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
