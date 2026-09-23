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

## Status / limitations

- Downloads from Higgsfield's CDN (`d8j0ntlcm91z4.cloudfront.net`) are blocked by this build
  environment's network policy, so the real footage, stills and raster logo **have not been downloaded,
  inspected or integrated yet**. The site runs in its static fallback until `frames/` is built.
- The scroll engine was verified with a synthetic 30 s test video run through the same
  `build-frames.sh` pipeline. At 1440×900 every beat reached its intended frame (0 → 599), chapters showed
  on their beats, the header switched glass→solid at the end of the flight, and there was no horizontal
  overflow.
- Scene timings in `content.js` follow the prompt's plan and need checking against the real clip.
