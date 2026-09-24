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
"$FFMPEG" -v error -i "$SRC" -an -vf "fps=$FPS,crop=trunc(ih*9/16/2)*2:ih:'(iw-ow)*($PORTRAIT_FOCUS)':0" \
  -c:v libwebp -quality 72 -start_number 0 "$STAGE/port/frame-%04d.webp"

# AVIF copies (same sizes, ~55% smaller files, decode about as fast as WebP) for browsers that support it.
# Encoded from lossless PNGs so they don't inherit WebP artefacts. Browsers without AVIF get the WebP set.
ENCODERS=$("$FFMPEG" -hide_banner -encoders 2>/dev/null || true)
if [[ "$ENCODERS" == *libaom-av1* ]]; then
  mkdir -p "$STAGE/landpng" "$STAGE/portpng" "$STAGE/landavif" "$STAGE/portavif"
  "$FFMPEG" -v error -i "$SRC" -an -vf "fps=$FPS,scale=$LW:-2:flags=lanczos" -start_number 0 "$STAGE/landpng/frame-%04d.png"
  "$FFMPEG" -v error -i "$SRC" -an -vf "fps=$FPS,crop=trunc(ih*9/16/2)*2:ih:'(iw-ow)*($PORTRAIT_FOCUS)':0" -start_number 0 "$STAGE/portpng/frame-%04d.png"
  avif() { "$FFMPEG" -v error -y -i "$1" -c:v libaom-av1 -still-picture 1 -crf 34 -cpu-used 6 -pix_fmt yuv420p -threads 1 -f avif "$2"; }
  export -f avif; export FFMPEG
  for pair in "landpng landavif" "portpng portavif"; do
    set -- $pair
    ls "$STAGE/$1" | sed 's/\.png$//' | xargs -P "$(nproc)" -I{} bash -c "avif '$STAGE/$1/{}.png' '$STAGE/$2/{}.avif'"
  done
  rm -rf "$STAGE/landpng" "$STAGE/portpng"
fi

COUNT=$(ls "$STAGE/land" | wc -l | tr -d ' ')
PCOUNT=$(ls "$STAGE/port" | wc -l | tr -d ' ')
FH=$(( LW * H / W / 2 * 2 ))
PW=$(( H * 9 / 16 / 2 * 2 ))

rm -rf "$ROOT/frames"
mkdir -p "$ROOT/frames"
mv "$STAGE/land" "$ROOT/frames/landscape"
mv "$STAGE/port" "$ROOT/frames/portrait"
[ -d "$STAGE/landavif" ] && mv "$STAGE/landavif" "$ROOT/frames/landscape-avif"
[ -d "$STAGE/portavif" ] && mv "$STAGE/portavif" "$ROOT/frames/portrait-avif"

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
  "avif": $( [ -d "$ROOT/frames/landscape-avif" ] && echo '{ "dir": "landscape-avif/", "pattern": "frame-%04d.avif" }' || echo null ),
  "portrait": { "count": $PCOUNT, "width": $PW, "height": $H, "dir": "portrait/", "focusBaked": true,
    "avif": $( [ -d "$ROOT/frames/portrait-avif" ] && echo '{ "dir": "portrait-avif/", "pattern": "frame-%04d.avif" }' || echo null ) }
}
JSON

# Poster = first frame; chapter stills = representative moments (seconds match content.js beats).
still() { "$FFMPEG" -v error -y -ss "$1" -i "$SRC" -frames:v 1 -vf "scale=$LW:-2:flags=lanczos" -c:v libwebp -quality 82 "$ROOT/assets/$2"; }
still 0     poster.webp
# Phones get a small upright poster so the first screen paints fast (it's the page's largest image).
"$FFMPEG" -v error -y -ss 0 -i "$SRC" -frames:v 1 -vf "crop=trunc(ih*9/16/2)*2:ih,scale=540:-2:flags=lanczos" -c:v libwebp -quality 72 "$ROOT/assets/poster-portrait.webp"
still 0     chapter-arrive.webp
still 4.5   chapter-taproom.webp
still 10.5  chapter-stills.webp
still 14.5  chapter-casks.webp
still 18.5  chapter-bottling.webp
still 29.8  chapter-reveal.webp

rm -rf "$STAGE"
echo "frames: $COUNT landscape (${LW}x${FH}) + $PCOUNT portrait (${PW}x${H}) @ ${FPS}fps, version $VERSION"
du -sh "$ROOT"/frames/*/
