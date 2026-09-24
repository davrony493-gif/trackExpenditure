#!/usr/bin/env bash
# Build the scroll frame sequence, manifest, poster and chapter stills from the master fly-through.
#   usage: scripts/build-frames.sh path/to/flythrough-master.mp4 [version]
# Needs ffmpeg + ffprobe on PATH (or FFMPEG / FFPROBE env vars; `npm i -g ffmpeg-static ffprobe-static` works).
set -euo pipefail

SRC="${1:?usage: build-frames.sh master.mp4 [version]}"
VERSION="${2:-$(date +%Y%m%d%H%M)}"
FFMPEG="${FFMPEG:-ffmpeg}"
FFPROBE="${FFPROBE:-ffprobe}"
FPS=20
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$(mktemp -d)"

# Native height only: never upscale (feed it the AI-upscaled master for sharper frames). Landscape for desktop, 9:16 crop for phones.
H=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$SRC")
W=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$SRC")
LW=$(( W > 1280 ? 1280 : W ))   # 720p-class frames: sharp enough, still quick to download

mkdir -p "$STAGE/land" "$STAGE/port"
"$FFMPEG" -v error -i "$SRC" -an -vf "fps=$FPS,scale=$LW:-2:flags=lanczos" \
  -c:v libwebp -quality 74 -start_number 0 "$STAGE/land/frame-%04d.webp"
# Portrait crop focus over clip time (0 = left, 0.5 = centre, 1 = right), matching the
# `focus` values in content.js: ease right to keep the distiller at the valve in frame.
PORTRAIT_FOCUS="if(lt(t,9.6),0.5,if(lt(t,10.4),0.5+0.22*(t-9.6)/0.8,if(lt(t,12.3),0.72,if(lt(t,12.8),0.72-0.22*(t-12.3)/0.5,0.5))))"
# Phones get JPEG: it decodes ~40% faster than WebP in Chrome and faster still in iOS Safari, which keeps
# fast thumb-scrolling smooth. Laptops/tablets keep WebP (smaller, and they decode it easily).
"$FFMPEG" -v error -i "$SRC" -an -vf "fps=$FPS,crop=trunc(ih*9/16/2)*2:ih:'(iw-ow)*($PORTRAIT_FOCUS)':0" \
  -q:v 6 -start_number 0 "$STAGE/port/frame-%04d.jpg"

# Tiny preview tier (every 2nd frame, ~1 MB each): downloads in seconds even on slow mobile data, so the flight
# always moves under the finger while the sharp frames are still arriving.
mkdir -p "$STAGE/pland" "$STAGE/pport"
"$FFMPEG" -v error -i "$SRC" -an -vf "fps=$FPS/2,scale=320:-2:flags=lanczos" -q:v 13 -start_number 0 "$STAGE/pland/frame-%04d.jpg"
"$FFMPEG" -v error -i "$SRC" -an -vf "fps=$FPS/2,crop=trunc(ih*9/16/2)*2:ih:'(iw-ow)*($PORTRAIT_FOCUS)':0,scale=180:-2:flags=lanczos" -q:v 13 -start_number 0 "$STAGE/pport/frame-%04d.jpg"
PLC=$(ls "$STAGE/pland" | wc -l | tr -d ' ')
PPC=$(ls "$STAGE/pport" | wc -l | tr -d ' ')

COUNT=$(ls "$STAGE/land" | wc -l | tr -d ' ')
PCOUNT=$(ls "$STAGE/port" | wc -l | tr -d ' ')
FH=$(( LW * H / W / 2 * 2 ))
PW=$(( H * 9 / 16 / 2 * 2 ))

rm -rf "$ROOT/frames"
mkdir -p "$ROOT/frames"
mv "$STAGE/land" "$ROOT/frames/landscape"
mv "$STAGE/port" "$ROOT/frames/portrait"
mv "$STAGE/pland" "$ROOT/frames/preview-landscape"
mv "$STAGE/pport" "$ROOT/frames/preview-portrait"

# Bundle each tier into packs (few requests instead of hundreds) and write the manifest.
PACK="$(dirname "$0")/pack-frames.mjs"
LAND=$(node "$PACK" "$ROOT/frames/landscape" 24)
PORT=$(node "$PACK" "$ROOT/frames/portrait" 24)
PLAND=$(node "$PACK" "$ROOT/frames/preview-landscape" 1000)
PPORT=$(node "$PACK" "$ROOT/frames/preview-portrait" 1000)
OUT="$ROOT/frames/manifest.json" node -e '
const [version, fps, lw, fh, pw, h, land, port, pland, pport] = process.argv.slice(1);
const tier = (json, dir, extra = {}) => ({ dir, ...JSON.parse(json), ...extra });
const manifest = {
  version, fps: +fps, format: "packs", poster: "../assets/poster.webp",
  width: +lw, height: +fh, ...tier(land, "landscape/"),
  preview: tier(pland, "preview-landscape/", { every: 2 }),
  portrait: { width: +pw, height: +h, focusBaked: true, ...tier(port, "portrait/"), preview: tier(pport, "preview-portrait/", { every: 2 }) },
};
require("fs").writeFileSync(process.env.OUT, JSON.stringify(manifest));
' "$VERSION" "$FPS" "$LW" "$FH" "$PW" "$H" "$LAND" "$PORT" "$PLAND" "$PPORT"

# Poster = first frame; chapter stills = representative moments (seconds match content.js beats).
still() { "$FFMPEG" -v error -y -ss "$1" -i "$SRC" -frames:v 1 -vf "scale=$LW:-2:flags=lanczos" -c:v libwebp -quality 82 "$ROOT/assets/$2"; }
still 0     poster.webp
still 0     chapter-arrive.webp
still 4.5   chapter-taproom.webp
still 10.5  chapter-stills.webp
still 14.5  chapter-casks.webp
still 18.5  chapter-bottling.webp
still 29.8  chapter-reveal.webp

rm -rf "$STAGE"
echo "frames: $COUNT landscape (${LW}x${FH}) + $PCOUNT portrait (${PW}x${H}) @ ${FPS}fps, version $VERSION"
du -sh "$ROOT/frames/landscape" "$ROOT/frames/portrait" "$ROOT/frames/preview-landscape" "$ROOT/frames/preview-portrait"
