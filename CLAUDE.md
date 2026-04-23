# CLAUDE.md — Hair AR Demo

Project context for Claude Code working on this repo. Keep responses short and concrete.

## What this is

B2B PoC (demo for one hairdresser on a tablet) of a virtual hairstyle try-on web app. The stylist takes a photo, the app analyzes the face shape, recommends hairstyles, and renders what the client would look like with a different cut and color.

**Success criterion:** one demo to one stylist on an iPad or Samsung Galaxy Tab. If approved, scope expands. If not, project is closed. Prioritize **speed of delivery and visual quality**, not architectural purity.

## Target devices

- **Primary:** iPad (iOS 16+) in Safari.
- **Secondary:** Samsung Galaxy Tab (S-series) in Chrome Android.

Both via `https://hair-ar-demo.vercel.app`. No native app. PWA "Add to Home Screen" gives fullscreen launch.

## Architecture (single-page flow)

Everything runs client-side except the Replicate call. One Next.js App Router app:

- `app/page.tsx` — single SPA with step state machine: `intro → camera → analyzing → style-select → generating → result`. State lives in React, images live in `IndexedDB` via `idb`.
- `app/api/hair-transfer/route.ts` — POSTs to Replicate. Hides token server-side. `maxDuration = 60` for slow FLUX cold-starts.
- `app/api/health/route.ts` — sanity-check for Vercel.

No database, no auth, no analytics, no Sentry, no i18n. Russian-only UI (stylist audience).

## Libraries and why

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router + TS | Auto-deploys on Vercel; server routes hide token. |
| Styles | Tailwind CSS v4 | No hand-written CSS. |
| Camera | Native `getUserMedia` + `<video>` + `<canvas>` | Works on iPad Safari 16+, zero deps. |
| Face landmarks | `@mediapipe/tasks-vision` `FaceLandmarker` | 468 points, WASM, Safari-compatible. |
| Hair mask | `@mediapipe/tasks-vision` `ImageSegmenter` | Real-time hair mask for recolor. |
| Shape transfer | Replicate SDK | Two models, see below. |
| Storage | `idb` → IndexedDB | Photos never leave device except when sent to Replicate. |
| Hosting | Vercel Hobby | `vercel deploy` one-liner, GitHub auto-deploy on push. |

## Replicate models (pinned versions)

Both version IDs are pinned in `lib/replicate-client.ts`. If inputs/outputs change, fetch new hashes via:

```bash
curl -s -H "Authorization: Token $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/models/flux-kontext-apps/change-haircut | jq -r '.latest_version.id'
```

### Primary: `flux-kontext-apps/change-haircut`

FLUX.1 Kontext [pro] based. Best visual quality. ~$0.03–0.06/run. Cold-start up to 30s, warm ~6s.

**Input schema (strict enums, not free text):**
- `input_image` (required, URL or data URI)
- `haircut` — enum: `"Bob"`, `"Pixie Cut"`, `"Layered"`, `"Wavy"`, `"Curly"`, `"Braided Ponytail"`, `"Cornrows"`, etc. See `lib/replicate-client.ts` for the full list.
- `hair_color` — enum: `"Blonde"`, `"Brunette"`, `"Auburn"`, `"Platinum Blonde"`, `"Copper"`, `"Black"`, etc.
- `gender` — `"none" | "male" | "female"` (default `"none"`).
- `aspect_ratio` — `"match_input_image"` default.

**Output:** single URL to PNG (stored 24h on Replicate CDN).

### Fallback: `wty-ustc/hairclip`

HairCLIP (CVPR 2022). Cheaper (~$0.002/run) but lower quality. Use when FLUX errors.

**Input schema (different field names — easy to confuse):**
- `image` (required, not `input_image`)
- `editing_type` — `"hairstyle" | "color" | "both"`
- `color_description` — free text (e.g. `"blond"`, `"red"`)
- `hairstyle_description` — enum: `"bob cut hairstyle"`, `"afro hairstyle"`, `"pixie cut hairstyle"`, etc.

## Secrets

`REPLICATE_API_TOKEN` is the only secret. Stored in:

1. `.env.local` (gitignored, local dev).
2. Vercel Project → Settings → Environment Variables (Production + Preview + Development).

**Never** prefix with `NEXT_PUBLIC_*` — that would leak to client bundle. Never commit `.env.local`. If a token ends up in a commit or logs, revoke it at https://replicate.com/account/api-tokens and create a new one.

## Deployment

Auto-deploy on push to `main` via GitHub → Vercel integration. Manual: `npx vercel deploy --prod`.

URL: `https://hair-ar-demo.vercel.app`.

## File layout

```
app/
  page.tsx              — SPA flow (all steps)
  layout.tsx            — PWA metadata, Apple icons, viewport
  globals.css
  api/
    hair-transfer/route.ts
    health/route.ts
components/
  CameraCapture.tsx     — getUserMedia + snap
  FaceAnalysis.tsx      — runs FaceLandmarker, returns face shape
  HairRecolor.tsx       — runs ImageSegmenter, HSL shift in canvas
  StyleGallery.tsx      — grid of recommended haircuts
  BeforeAfterSlider.tsx — drag split of original vs generated
  ui/                   — minimal Button, Card primitives
lib/
  mediapipe-loader.ts   — singletons, GPU→CPU fallback
  face-shape.ts         — 468-landmark heuristic → oval|round|square|heart|oblong|diamond
  hair-color.ts         — dominant hair color from mask (HSL bucketing)
  hair-length.ts        — short|medium|long from mask bbox ratio
  recommendations.ts    — static face-shape → haircuts dict + maps to Replicate enums
  replicate-client.ts   — wrapper with FLUX primary, HairCLIP fallback
  storage.ts            — IndexedDB helpers (idb)
public/
  manifest.json
  icon-192.png
  icon-512.png
  apple-touch-icon.png
```

## What NOT to add (PoC scope)

- Auth / accounts / DB
- Admin UI
- Analytics
- i18n (Russian only)
- SEO / Lighthouse / bundle-size tuning
- Autotests (manual checklist in README only)
- Real-time AR (video-stream overlay) — that is the *next* stage, not this one

## iPad Safari gotchas (learned the hard way)

- `<video>` needs `playsInline muted autoPlay` or Safari goes fullscreen.
- `getUserMedia` requires HTTPS and a user gesture — wrap in an explicit button click.
- Permission is asked **every session** unless user chose "Always allow for this site". Handle denial gracefully.
- MediaPipe `delegate: "GPU"` sometimes crashes on older iPads — try/catch and fall back to `"CPU"`.
- `apple-mobile-web-app-capable` gives fullscreen PWA on "Add to Home Screen".

## Commit style

Short, present-tense subject. Body explains why, not what.

## Testing

Manual only. Checklist in `README.md` under "Testing on device". Must pass on **both** iPad Safari AND Galaxy Tab Chrome before claiming done.
