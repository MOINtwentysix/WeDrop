import sharp from "sharp";
import { mkdir } from "node:fs/promises";
await mkdir("public/icons", { recursive: true });
const svg = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#d7f279"/><path d="M256 133v224m-88-88 88 88 88-88" fill="none" stroke="#26352b" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/></svg>',
);
for (const [name, size] of [
  ["icon-192", 192],
  ["icon-512", 512],
  ["apple-touch-icon", 180],
  ["maskable-512", 512],
])
  await sharp(svg).resize(size, size).png().toFile(`public/icons/${name}.png`);
