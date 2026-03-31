#!/usr/bin/env python3
"""Generate a playlist JSON from the project's music folder.

This script can optionally copy the project's `music/` tree into the build `public/`
folder so Vercel/Vite will serve the files unchanged.

Behavior:
- Scans the `music/` directory for audio files.
- Looks for cover images in `music/album/` named after the track, or common cover names in the same folder.
- By default the script will emit web paths like `/<music-dir-name>/...` so they work when
    the music folder is served from the site root (for example `public/music`).

Usage:
    python scripts/generate_playlist.py
    python scripts/generate_playlist.py --music ./music --out src/assets/playlist.json
    # copy files into public/ and generate playlist with web paths
    python scripts/generate_playlist.py --copy
"""

from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
from typing import List, Optional
import shutil

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
    # 1) check <music_dir>/album/<basename>
    for ext in IMAGE_EXTS:
        p = album_dir / (basename + ext)
        if p.is_file():
            return f'/{music_dir.name}/album/' + p.name

    # 2) common names in same dir
    for name in COMMON_COVER_NAMES:
        for ext in IMAGE_EXTS:
            p = file_dir / (name + ext)
            if p.is_file():
                rel = p.relative_to(music_dir).as_posix()
                return f'/{music_dir.name}/' + rel

    # 3) file-specific image in same dir
    for ext in IMAGE_EXTS:
        p = file_dir / (basename + ext)
        if p.is_file():
            rel = p.relative_to(music_dir).as_posix()
            return f'/{music_dir.name}/' + rel

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
                src = f'/{music_dir.name}/' + rel
                basename = p.stem
                cover = find_cover_for(basename, p.parent, music_dir)
                items.append({'src': src, 'cover': cover or ''})
    return items


def main(argv: List[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description='Generate playlist JSON from music folder')
    ap.add_argument('--music', '-m', default='music', help='path to music directory (default: music)')
    ap.add_argument('--out', '-o', default='src/assets/playlist.json', help='output JSON file (default: src/assets/playlist.json)')
    ap.add_argument('--public', '-p', default='public', help='public directory to copy files into (default: public)')
    ap.add_argument('--copy', action='store_true', help='copy music files into the public directory so they are served as static assets')
    ap.add_argument('--root', '-r', default='.', help='project root (default: current dir)')
    args = ap.parse_args(argv)

    project_root = Path(args.root).resolve()
    music_dir = (project_root / args.music).resolve()
    out_file = (project_root / args.out).resolve()
    public_dir = (project_root / args.public).resolve()

    if not music_dir.exists() or not music_dir.is_dir():
        print(f'Error: music directory not found: {music_dir}', flush=True)
        return 2

    # If requested, copy the music tree into the public folder so Vercel will serve it.
    if args.copy:
        public_music_dir = public_dir / music_dir.name
        if public_music_dir.exists():
            print(f'Public music directory already exists, will overwrite files: {public_music_dir}', flush=True)
        public_music_dir.mkdir(parents=True, exist_ok=True)
        # copy files and directories preserving structure
        for root, dirs, files in os.walk(music_dir):
            rel_root = Path(root).relative_to(music_dir)
            target_root = public_music_dir / rel_root
            target_root.mkdir(parents=True, exist_ok=True)
            for fname in files:
                src_file = Path(root) / fname
                dst_file = target_root / fname
                try:
                    shutil.copy2(src_file, dst_file)
                except Exception as e:
                    print(f'Warning: failed to copy {src_file} -> {dst_file}: {e}', flush=True)

    playlist = collect_playlist(music_dir)

    out_file.parent.mkdir(parents=True, exist_ok=True)
    with out_file.open('w', encoding='utf-8') as f:
        json.dump(playlist, f, ensure_ascii=False, indent=2)

    print(f'Wrote {len(playlist)} tracks to {out_file}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
