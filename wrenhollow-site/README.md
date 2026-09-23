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

## Run it with the AI chat assistant

`server.mjs` serves the same site and adds an "Ask the brewer" chat bubble. It can use
**Google Gemini** or **Groq** (both have free API keys), **DeepSeek**, or **Claude**. Your key stays
on the server; the browser only talks to `/api/chat`. Needs Node.js 18 or newer.

| Service | Free? | Get a key | Start command (no `npm install` needed) |
| --- | --- | --- | --- |
| Google Gemini | Free tier | https://aistudio.google.com/apikey | `GEMINI_API_KEY=your-key node server.mjs` |
| Groq | Free tier | https://console.groq.com/keys | `GROQ_API_KEY=your-key node server.mjs` |
| DeepSeek | Paid (top up) | https://platform.deepseek.com | `DEEPSEEK_API_KEY=your-key node server.mjs` |
| Claude | Paid | https://console.anthropic.com | `npm install`, then `ANTHROPIC_API_KEY=your-key npm start` |

**Easiest: keep the key in a `.env` file** in this folder (it's git-ignored and never served), so you only
have to run `node server.mjs`:

```sh
touch .env && open -e .env        # opens it in TextEdit; add one line such as GEMINI_API_KEY=your-key, then save
node server.mjs
```

Then open http://localhost:8000. Free tiers have rate limits, and Google may use free-tier Gemini
requests to improve its products; check each service's terms before going live.

Without a key, or when served by `python3 -m http.server`, the chat bubble simply doesn't appear.

- The assistant only knows what's in `content.js` (beers, tours, hours, address), so edit that file and restart.
- Replies are short and plain text. It won't take bookings; it points people to the booking form.
- Limits: 20 questions per visitor IP per 10 minutes and 1,500 characters per message. Replies are
  capped at 2,048 tokens (4,096 on Claude).
- Settings:
  - `CHAT_PROVIDER` is `gemini`, `groq`, `deepseek` or `claude`. If it isn't set, the first service
    whose key is set is used, in that order.
  - `CHAT_MODEL` sets the model. Defaults: `gemini-3.6-flash`, `llama-3.3-70b-versatile`, `deepseek-chat`,
    `claude-opus-5`. Change it if a service renames its models.
  - `GEMINI_BASE_URL`, `GROQ_BASE_URL` and `DEEPSEEK_BASE_URL` override the endpoints.
  - `PORT` defaults to 8000.
  - `HOST` defaults to 127.0.0.1. Use 0.0.0.0 to test from your phone on the same Wi-Fi.
- If a request fails, the terminal prints why. For example, 401/403 is a wrong key, 402 is an account that
  needs topping up, 404 is an unknown model, and 429 is a rate or free-tier limit. Visitors only see a
  polite "unavailable" message.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page structure: header, fly-through stage, range, tours, process, visit/booking, footer |
| `content.js` | **Edit this.** All copy, products, tours, hours, and the flight beat timeline |
| `app.js` | Scroll→frame engine, chapter fades, header state, mobile menu, demo form |
| `chat.js` | "Ask the brewer" chat widget (only shown when `server.mjs` has an API key) |
| `server.mjs` | Node server: static files + `/api/chat` proxy to Gemini, Groq, DeepSeek or Claude |
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
