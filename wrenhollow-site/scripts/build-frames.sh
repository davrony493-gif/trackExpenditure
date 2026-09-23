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

# Native height only: never upscale. Landscape for desktop, 9:16 centre crop for phones.
H=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$SRC")
W=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$SRC")
LW=$(( W > 1440 ? 1440 : W ))

mkdir -p "$STAGE/land" "$STAGE/port"
"$FFMPEG" -v error -i "$SRC" -an -vf "fps=$FPS,scale=$LW:-2:flags=lanczos" \
  -c:v libwebp -quality 80 -start_number 0 "$STAGE/land/frame-%04d.webp"
"$FFMPEG" -v error -i "$SRC" -an -vf "fps=$FPS,crop=trunc(ih*9/16/2)*2:ih" \
  -c:v libwebp -quality 80 -start_number 0 "$STAGE/port/frame-%04d.webp"

COUNT=$(ls "$STAGE/land" | wc -l | tr -d ' ')
PCOUNT=$(ls "$STAGE/port" | wc -l | tr -d ' ')
FH=$(( LW * H / W / 2 * 2 ))
PW=$(( H * 9 / 16 / 2 * 2 ))

rm -rf "$ROOT/frames"
mkdir -p "$ROOT/frames"
mv "$STAGE/land" "$ROOT/frames/landscape"
mv "$STAGE/port" "$ROOT/frames/portrait"

cat > "$ROOT/frames/manifest.json" <<JSON
{
  "version": "$VERSION",
  "fps": $FPS,
  "count": $COUNT,
  "width": $LW,
  "height": $FH,
  "dir": "landscape/",
  "pattern": "frame-%04d.webp",
  "pad": 4,
  "start": 0,
  "poster": "../assets/poster.webp",
  "portrait": { "count": $PCOUNT, "width": $PW, "height": $H, "dir": "portrait/" }
}
JSON

# Poster = first frame; chapter stills = representative moments (seconds match content.js beats).
still() { "$FFMPEG" -v error -y -ss "$1" -i "$SRC" -frames:v 1 -vf "scale=$LW:-2:flags=lanczos" -c:v libwebp -quality 82 "$ROOT/assets/$2"; }
still 0     poster.webp
still 0     chapter-arrive.webp
still 5     chapter-taproom.webp
still 9.5   chapter-stills.webp
still 14.5  chapter-casks.webp
still 19    chapter-bottling.webp
still 29.8  chapter-reveal.webp

rm -rf "$STAGE"
echo "frames: $COUNT landscape (${LW}x${FH}) + $PCOUNT portrait (${PW}x${H}) @ ${FPS}fps, version $VERSION"
du -sh "$ROOT/frames/landscape" "$ROOT/frames/portrait"
