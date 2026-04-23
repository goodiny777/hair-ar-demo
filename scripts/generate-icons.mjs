// One-off icon generator. Run once (or after editing the design) with:
//   node scripts/generate-icons.mjs
//
// Writes public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png.
// Produces a simple "H·AR" dark mark on a soft gradient — replace with a real
// design asset later.

import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");

function svg(size) {
  const fontSize = Math.round(size * 0.34);
  const sub = Math.round(size * 0.15);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111827"/>
      <stop offset="1" stop-color="#1f2937"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#g)"/>
  <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle"
        font-family="-apple-system, Helvetica, Arial, sans-serif"
        font-weight="700" font-size="${fontSize}" fill="#ffffff" letter-spacing="-2">HAIR</text>
  <text x="50%" y="78%" text-anchor="middle" dominant-baseline="middle"
        font-family="-apple-system, Helvetica, Arial, sans-serif"
        font-weight="500" font-size="${sub}" fill="#9ca3af" letter-spacing="4">AR DEMO</text>
</svg>`;
}

async function render(size, name) {
  const png = await sharp(Buffer.from(svg(size))).png().toBuffer();
  const out = resolve(publicDir, name);
  await writeFile(out, png);
  console.log(`wrote ${out} (${png.length} bytes)`);
}

await render(192, "icon-192.png");
await render(512, "icon-512.png");
await render(180, "apple-touch-icon.png");
