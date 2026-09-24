# Production notes

## Direction

- **Brand:** Wrenhollow Brewery & Distillery (fictional). A riverside red-brick barn housing a
  brewhouse, still house, barrel warehouse and bottling line.
- **Palette:** hop-dark `#15180F`, copper `#B8733A`, barley `#D6A84A`, river `#5E7A78`, parchment `#F3EBDD`.
- **Type:** Fraunces (display) and Manrope (body).
- **Start still:** option B, a red-brick barn at dusk with its green arched door open onto the bar
  (the user's choice).

## Route (one continuous take, 30 s)

| Time | Beat |
| --- | --- |
| 0–3 s | Push through the open tasting-room door |
| 3–7 s | Bank along the bar, yaw toward the back arch |
| 7–12 s | Copper stills: distiller opens a valve, steam rises |
| 12–17 s | Weave down the cask aisle, turn at the end |
| 17–21 s | Track beside bottles moving on the conveyor |
| 21–24 s | Out the loading-bay doors, 180° yaw |
| 24–30 s | Fly backwards and climb: orchards, fields, river |

## Generations (Higgsfield MCP)

| Asset | Model | Job ID | Credits |
| --- | --- | --- | --- |
| Logo concept | GPT Image 2.5 (high, 2k) | `a537156a-d93b-4bdd-9b99-e2d5f396caf3` | 2.75 |
| Start still A (stone farmhouse) | GPT Image 2.5 | `b49a8241-68ea-4207-ab2e-1ac4b6ef7933` | 2.75 |
| Start still B (brick barn, **chosen**) | GPT Image 2.5 | `70177d18-0281-4d06-a678-9616c2f1b686` | 2.75 |
| Reveal still (rear aerial, ref: B) | GPT Image 2.5 | `85b367c3-14fa-453a-8731-1858b35fa551` | 2.75 |
| Fly-through, 30 s, 480p, no audio | Seedance 2.5 `omni_reference` (start_image B, image ref reveal) | `f6015120-39bb-4409-9fd4-20ad34871cca` | 90 |

Total ≈ 101 of the 110 available credits.

### Budget trade-off

With a 110-credit budget the flight is **one 30 s clip at 480p** rather than the recommended three chained
~15 s clips at 720p+ (≈350–450 credits). As a result:

- Each scene gets about 4–6 s, so the manoeuvres are brisker than planned.
- There was no credit left for repairs, trims-and-extends or a regeneration.
- The frames are 854×480 and look soft full-screen on large or high-DPI displays. The phone
  portrait crop is 270×480.

Upgrade path: regenerate at 720p/1080p as chained extensions (Clip A `omni_reference`, then B/C
`video_extension` forward), rebuild with `scripts/build-frames.sh`, and adjust the beat seconds in
`content.js` if the scene timings move.

## Prompt (fly-through)

See the `f6015120…` job in Higgsfield for the full text. It describes a first-person camera (never the word
"drone"), gives timed manoeuvres for each scene, states that nothing appears or disappears, and asks for
no text, logos or signage.

## Footage review

- Contact sheet and scene-cut detection (`gt(scene,0.3)` and `0.15`): **no hidden cuts**, no stray drones or
  objects, and no pop-ins. The route reads as planned: door 0–2 s, bar 2–7 s, copper still and steam 7–10 s,
  distiller at the valve 10–12.5 s, cask aisle 12.5–16.5 s, bottling line 16.5–20.5 s, loading bay and 180° yaw
  20.5–24.5 s, backward climb over orchards, fields and river 24.5–30 s.
- There's one copper pot still plus a steel vessel (not two stills), and the copy has been corrected to match.
- A painted "21" is visible on a machine on the bottling line. It isn't a brand mark, so it was left in.
- No repairs were needed. The master is the raw clip (`production/flythrough-master.mp4`).

## Frames

- **AI upscale (free):** every frame of the 480p master was upscaled 4× with Real-ESRGAN (`realesr-general-x4v3`,
  run on CPU through `spandrel`), then saved at 1708×960 and reassembled into `production/flythrough-master-upscaled.mp4`.
  Flicker check: consecutive upscaled frames differ only about 10% more than the originals, which is expected from
  sharper edges, not shimmer. The original clip is kept as `production/flythrough-master.mp4`.
- 601 frames at 20 fps, built from the upscaled master. Landscape frames are 1280×718, portrait frames 540×960
  (used only by phones held upright). Each comes as AVIF (used when the browser can decode it; ≈55% smaller than
  WebP at the same size and about as fast to decode, measured in Chromium with a 4× CPU slowdown) and WebP (fallback).
- First screen: the poster (a 540×960 crop for upright phones, ≈48 KB) is preloaded with high priority, and fonts are
  self-hosted and preloaded. Frames only start downloading once the page has loaded and gone idle, or as soon as the
  visitor starts scrolling, so they never compete with the first paint. A small "Loading the fly-through…" pill shows
  until the first frame is on screen, and again if scrolling outruns the download.
- Loading: the browser downloads the whole sequence once in the background (nearest frames first; skipped with Data
  Saver) and decodes only frames near the current position. On phones the decode window (24 ahead, 8 behind) stays
  inside the 36-frame memory budget, so frames aren't evicted and decoded again while still needed. On a simulated phone (4× CPU slowdown, 10 Mbps),
  380 of 601 frames arrived within 8 s on the first screen, and fast jumps showed the right frame within about 0.2 s.
- The portrait crop eases right (focus 0.72) from 10 to 12.5 s so the distiller at the valve stays in frame.
  The same focus is stored in `content.js` (the `valve` beat) and baked into the portrait sequence by
  `scripts/build-frames.sh` (`PORTRAIT_FOCUS`).

## Checks performed (headless Chromium)

- **Desktop 1440×900:** every beat reached its intended frame (0 → 600), chapters showed on their beats,
  the header went glass → solid at the end of the flight and back again when scrolling up, and nothing
  overflowed sideways. Re-checked after the mobile changes.
- **Phones 360×740, 375×812, 390×844, 430×932 (portrait) and 844×390 (landscape):** phones held upright
  requested only portrait frames and the landscape phone only landscape frames. There was no sideways overflow
  in any section, the header turned solid after the flight, and chapter copy sat low over the scrim.
  The menu opened with focus on its close button, locked page scrolling, closed on Escape (returning focus to
  the menu button) and closed after a link was tapped. Anchors landed below the fixed header.
- **Tablets 768×1024, 820×1180, 1024×1366 (upright) and 1024×768, 1180×820, 1366×1024 (landscape):** no
  sideways overflow and no wrapped header text. Below 1024px wide, the header collapses into the ☰ menu while keeping
  "Book a tasting" and the account button. Upright tablets anchor chapter copy low over a scrim, use the shorter
  touch scroll pacing, and follow the same per-beat crop focus as phones, so the distiller stays in frame. The menu,
  sign-up dialog and chat were checked at 768×1024.
- **Reduced motion:** static chapter sections and no frame requests on desktop or phone.
- **Not measured:** real network loading speed and real-device (iOS/Android) scrolling feel. Google Fonts
  didn't load in the headless test (proxy certificate), so screenshots show fallback fonts.

## Known limitations

- The footage was generated at 480p (budget) and AI-upscaled to 720p-class frames. It is clearly sharper than before,
  but not identical to footage generated at 720p or higher.
- On phones the opening frame is cropped inside the doorway (the arch is wider than a 9:16 crop), so the
  first screen reads as looking into the bar rather than at the whole door.
