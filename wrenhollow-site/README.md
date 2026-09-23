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

## Member accounts (Supabase)

Visitors can create an account, log in, reset a forgotten password, save booking requests, see their
status, cancel them, and collect loyalty stamps. Accounts run on [Supabase](https://supabase.com)
(free tier), which stores passwords securely and sends the confirmation and reset emails.
**Row Level Security** means each member can only ever read or change their own data.

**One-time setup:**

1. Create a free account at https://supabase.com and click **New project**. Choose a name and a
   database password, and pick the region closest to you.
2. Open **SQL Editor**, click **New query**, paste everything from `supabase/schema.sql`, and click **Run**.
3. Go to **Authentication → URL Configuration**. Set **Site URL** to `http://localhost:8000` and add
   `http://localhost:8000/**` under **Redirect URLs**. Change these to your real web address when the site goes live.
4. Go to **Project Settings → API Keys** (or **API**). Copy the **Project URL** and the **anon / publishable**
   key. Never use the `service_role` / secret key; the server refuses it.
5. Add them to your `.env` file (`open -e .env`):
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```
6. Run `npm install` (once), then `node server.mjs`. The terminal should say `Member accounts on: …`, and a
   **Log in** button appears in the header.

**Running it day to day (for staff, in the Supabase dashboard):**

- **Confirm or decline bookings:** in **Table Editor → bookings**, change a row's `status` to `confirmed`
  or `cancelled`. Members see the change under My account.
- **Stamp a loyalty card:** find the member's id under **Authentication → Users**, then in
  **Table Editor → stamps** click **Insert row** and paste that id into `user_id`. Every 10 stamps
  shows as a free Tasting Flight. This reward is a placeholder; change `STAMPS_FOR_REWARD` in `account.js`.
- **Marketing list:** in **Table Editor → profiles**, filter `marketing_opt_in = true`.

**Before launch:**

- Supabase's built-in email sender is only meant for testing and sends a limited number of emails per hour.
  Add your own email service under **Authentication → Emails → SMTP settings**.
- Edit `privacy.html`: it's a placeholder with a placeholder contact address.
- New booking requests don't notify staff yet. Check the bookings table, or ask for a notification to be added.
- Account deletion is handled on request by email (see `privacy.html`). A self-service delete button would need
  a small server function.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page structure: header, fly-through stage, range, tours, process, visit/booking, footer |
| `content.js` | **Edit this.** All copy, products, tours, hours, and the flight beat timeline |
| `app.js` | Scroll→frame engine, chapter fades, header state, mobile menu, demo form |
| `chat.js` | "Ask the brewer" chat widget (only shown when `server.mjs` has an API key) |
| `account.js` | Member accounts: log in, sign up, password reset, My account (only shown when Supabase is set up) |
| `supabase/schema.sql` | Database tables and Row Level Security rules to run once in Supabase |
| `privacy.html` | Privacy notice (placeholder) linked from the sign-up form |
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
