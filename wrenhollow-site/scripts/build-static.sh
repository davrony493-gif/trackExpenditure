#!/usr/bin/env bash
# Copy the public files into dist/ for a static host (Netlify, Cloudflare Pages).
#   usage: scripts/build-static.sh
# Leaves out everything that shouldn't be public: the Node server, the database schema, the
# production masters (large MP4s), node_modules and .env. On a static host the chat assistant and
# member accounts stay switched off (they need server.mjs); everything else works.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist"
rm -rf "$OUT"
mkdir -p "$OUT"
cp "$ROOT"/*.html "$ROOT"/*.js "$ROOT"/*.css "$OUT"/
cp -r "$ROOT/assets" "$ROOT/frames" "$OUT"/
for f in robots.txt favicon.ico site.webmanifest _headers; do
  [ -f "$ROOT/$f" ] && cp "$ROOT/$f" "$OUT"/
done
echo "dist/: $(find "$OUT" -type f | wc -l | tr -d ' ') files, $(du -sh "$OUT" | cut -f1)"
