#!/usr/bin/env bash
# Converts photos to WebP for the site: longest edge 1600px, quality 82.
# Usage: scripts/photos.sh input1.jpg input2.png ...   -> assets/photos/<name>.webp
set -euo pipefail
out="$(cd "$(dirname "$0")/.." && pwd)/assets/photos"
mkdir -p "$out"
for src in "$@"; do
  name="$(basename "${src%.*}" | tr 'A-Z ' 'a-z-')"
  dest="$out/$name.webp"
  if command -v cwebp >/dev/null 2>&1; then
    cwebp -quiet -q 82 -resize 1600 0 "$src" -o "$dest"
  elif command -v magick >/dev/null 2>&1; then
    magick "$src" -auto-orient -resize '1600x1600>' -quality 82 "$dest"
  else
    convert "$src" -auto-orient -resize '1600x1600>' -quality 82 "$dest"
  fi
  printf '%s -> %s (%s KB)\n' "$src" "$dest" "$(( $(stat -c %s "$dest") / 1024 ))"
done
