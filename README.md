# Hair AR Demo

Virtual hairstyle try-on for a salon PoC. One stylist, one tablet, one demo. The client takes a selfie, the app analyzes face shape, recommends hairstyles, and generates a photorealistic preview of the new cut and color via Replicate.

> **Status:** proof-of-concept. Demo on `https://hair-ar-demo.vercel.app`. iPad Safari + Samsung Galaxy Tab Chrome are the only supported browsers.

---

## Quick start (local)

Requires Node.js 22.9+ and an account at [replicate.com](https://replicate.com).

```bash
git clone git@github.com:goodiny777/hair-ar-demo.git
cd hair-ar-demo
npm install
cp .env.local.example .env.local
# Open .env.local and paste your Replicate token
npm run dev
```

Then open http://localhost:3000.

> `getUserMedia` on Safari and Chrome requires HTTPS except on `localhost` / `127.0.0.1`. Dev on `localhost` works fine; if you want to test from a phone on your LAN, use [ngrok](https://ngrok.com) or [localtunnel](https://localtunnel.github.io/www/) to get an HTTPS URL.

---

## Environment variables

| Variable | Where to set | What for |
|---|---|---|
| `REPLICATE_API_TOKEN` | `.env.local` + Vercel project settings | Auth for the `/api/hair-transfer` route. **Server-side only — never prefix `NEXT_PUBLIC_*`.** |

Get a token at https://replicate.com/account/api-tokens.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Next dev server on :3000 |
| `npm run build` | Production build (runs in CI / on Vercel) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

---

## Deploy to Vercel

### One-time setup

```bash
npm i -g vercel                    # or use npx
vercel login
vercel link                        # in project dir, pick "Create new project"
vercel env add REPLICATE_API_TOKEN production
vercel env add REPLICATE_API_TOKEN preview
vercel env add REPLICATE_API_TOKEN development
```

### Every deploy

Push to `main` — Vercel auto-deploys. Or manually:

```bash
vercel deploy --prod
```

---

## Project structure

```
app/
  page.tsx                 SPA: intro → camera → analyze → style → generate → result
  layout.tsx               PWA metadata, viewport, Apple icons
  api/
    hair-transfer/route.ts POST { image, haircut, hair_color } → Replicate
    health/route.ts        GET { ok: true }

components/
  CameraCapture.tsx        getUserMedia + snap into canvas
  FaceAnalysis.tsx         runs FaceLandmarker, classifies shape
  HairRecolor.tsx          runs ImageSegmenter, HSL recolor in canvas
  StyleGallery.tsx         recommended haircut tiles
  BeforeAfterSlider.tsx    drag-split "before vs after"
  ui/                      minimal Button/Card primitives

lib/
  mediapipe-loader.ts      singleton loaders with GPU→CPU fallback
  face-shape.ts            6-shape heuristic from 468 landmarks
  hair-color.ts            dominant color bucket from mask pixels
  hair-length.ts           length estimate from mask bbox
  recommendations.ts       face-shape → haircut+color presets
  replicate-client.ts      FLUX primary, HairCLIP fallback
  storage.ts               IndexedDB via idb

public/
  manifest.json            PWA manifest
  icon-192.png             Home screen icon (small)
  icon-512.png             Home screen icon (large)
  apple-touch-icon.png     Apple home screen icon
```

---

## Replicate models

Pinned in `lib/replicate-client.ts`:

- **Primary** — `flux-kontext-apps/change-haircut` — FLUX.1 Kontext [pro], text-prompt edit, ~$0.03–0.06/run, cold-start up to 30s.
- **Fallback** — `wty-ustc/hairclip` — HairCLIP, reference image + text, ~$0.002/run.

If either model's version ID or schema changes, refetch:

```bash
curl -s -H "Authorization: Token $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/models/flux-kontext-apps/change-haircut \
  | jq '{id: .latest_version.id, schema: .latest_version.openapi_schema.components.schemas.Input}'
```

---

## Testing on device (acceptance checklist)

This PoC is only "done" when the full flow works end-to-end on a real tablet — not a desktop emulator.

### iPad (Safari 16+)

- [ ] `https://hair-ar-demo.vercel.app` opens with no console errors
- [ ] Camera permission prompt appears; granting → live preview
- [ ] "Take photo" freezes the frame and shows a preview
- [ ] Face-shape readout appears within 5s of snapshot
- [ ] Hair color swatches recolor the hair on tap, no lag
- [ ] Selecting a recommended style + pressing "Generate" returns an image in 3–30s
- [ ] Before/after slider drags smoothly
- [ ] "Add to Home Screen" from Safari's share sheet → app launches fullscreen, no browser chrome
- [ ] Layout works in both portrait and landscape

### Samsung Galaxy Tab (Chrome Android)

- [ ] Same URL, no console errors
- [ ] Camera permission prompt → live preview
- [ ] MediaPipe inits without WebGL errors (check `chrome://inspect`)
- [ ] Recolor runs at ≥15 FPS (older Tab A models may drop to 8 — if so, CPU fallback kicks in automatically)
- [ ] Chrome's "Install app" menu item appears (thanks to `manifest.json`) → icon on launcher
- [ ] API route `/api/hair-transfer` works identically

If one device passes and the other fails, fix before demoing — the stylist may show up with either.

---

## Known limitations

- FLUX `haircut` is a strict enum; we can't request "wavy bob with bangs" — we pick one of the ~90 supported names.
- Cold-start Replicate call can take 20–40s (shown to user as a loader).
- Vercel Hobby has a 4.5 MB request-body limit — we resize to 1024×1024 JPEG before upload (~200 KB, safe margin).
- No real-time AR overlay (video-feed hairstyle preview) — that requires a different architecture and is out of scope for the PoC.

---

## After-demo housekeeping

The Replicate token in the initial plan doc was shared in plaintext. **Revoke it** at https://replicate.com/account/api-tokens once the demo is done, create a fresh one, and rotate it in:

1. `.env.local` on your laptop
2. Vercel → Project → Settings → Environment Variables (Production + Preview + Development)

Redeploy after rotating (`vercel --prod` or a no-op commit push).

---

## Troubleshooting

**"Camera not working on iPad"**
Safari → Settings → Websites → Camera → Allow for `hair-ar-demo.vercel.app`. Or remove all permissions and re-grant on next visit.

**"MediaPipe fails to load"**
Check console — if WebGL is missing, we auto-fallback to CPU delegate. On very old iPads (iPad Air 2 or older), this may still fail. Use a newer device.

**"Replicate call times out"**
Vercel Hobby kills requests at 60s. If FLUX cold-start takes longer, the route returns 504. Retry — subsequent calls hit the warm instance and complete in ~6s.

**"502 Bad Gateway on deploy"**
Usually means the Replicate token env var isn't set in Production. Check `vercel env ls`.
