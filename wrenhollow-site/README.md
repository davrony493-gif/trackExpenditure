# Wrenhollow Brewery & Distillery (demo website)

A scroll-driven fly-through site for a **fictional** brewery and distillery. The camera enters the
tasting-room door, flies past the copper stills, down the barrel warehouse and along the bottling line,
then goes out the loading bay, spins round and climbs to reveal the orchards, fields and river.

Everything here is invented: the name, logo, products, prices, hours and address are placeholders.

## Run it

Static site with no build step:

```sh
cd wrenhollow-site
python3 -m http.server 8080   # then open http://localhost:8080
```

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page structure: header, fly-through stage, range, tours, process, visit/booking, footer |
| `content.js` | **Edit this.** All copy, products, tours, hours, and the flight beat timeline |
| `app.js` | Scroll→frame engine, chapter fades, header state, mobile menu, demo form |
| `styles.css` | Design tokens and layout |
| `style-tile.html` | Style tile: logo, palette, type, components, imagery direction |
| `assets/logo-mark.svg` | Editable vector logo mark |
| `scripts/build-frames.sh` | Builds `frames/`, the manifest, poster and chapter stills from the master video |
| `production/NOTES.md` | Generation log: prompts, job IDs, credits, known limitations |

## Editing the flight timing

Every beat in `content.js → flight.beats` maps its own scroll distance (`vh`, and `mvh` on phones) to a
clip interval (`from` → `to` seconds). A beat with `from === to` holds a single frame. `chapter` picks which
block of copy is on screen during that beat. Copy fades in at the start of its chapter and out at the end.
The first chapter is visible at rest, and the last one holds at the end.

## Installing the footage

```sh
npm i -g ffmpeg-static ffprobe-static   # if ffmpeg isn't installed
FFMPEG=$(which ffmpeg) FFPROBE=$(which ffprobe) scripts/build-frames.sh flythrough-master.mp4
```

If `frames/manifest.json` is missing, or when a visitor prefers reduced motion, the site shows each
chapter as a normal section over its still image instead of running the animation.

## Mobile

It's one responsive site. Phones get a fixed glass header with a menu, chapter copy anchored low over a
scrim, a shorter scroll timeline (`mvh` per beat) and a pre-cropped portrait frame sequence cut from the same
master. No separate mobile video exists.

## Before launch

- Replace the placeholder products, prices, hours and address in `content.js`.
- Connect the booking form to a real service (it's clearly marked as a demo and never claims to send).
- Swap the Google Fonts link for self-hosted fonts if you need to avoid third-party requests.
