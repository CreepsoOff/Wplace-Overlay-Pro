import { createCanvas, loadImage } from './canvas';
import { TILE_SIZE } from './constants';
import { extractPixelCoords } from './overlay';
import type { OverlayItem } from './store';

export function rgbKeyToHex(key: string): string {
  const [r,g,b] = key.split(',').map(n => parseInt(n,10));
  const toHex = (n: number) => n.toString(16).padStart(2,'0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export async function updateOverlayColorStats(ov: OverlayItem) {
  if (!ov.imageBase64) {
    ov.colorStats = undefined;
    ov.colorFilter = undefined;
    return;
  }
  const img = await loadImage(ov.imageBase64);
  const canvas = createCanvas(img.width, img.height) as HTMLCanvasElement;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const wImg = img.width, hImg = img.height;
  const id = ctx.getImageData(0, 0, wImg, hImg);
  const data = id.data;

  const stats: Record<string, { total: number; remaining: number }> = {};

  const base = ov.pixelUrl ? extractPixelCoords(ov.pixelUrl) : null;
  const neededTiles = new Set<string>();

  // First pass – count total pixels and gather tiles
  for (let y = 0; y < hImg; y++) {
    for (let x = 0; x < wImg; x++) {
      const idx = (y * wImg + x) * 4;
      const a = data[idx + 3];
      if (a === 0) continue;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      // Skip #deface transparency color
      if (r === 0xde && g === 0xfa && b === 0xce) continue;
      const key = `${r},${g},${b}`;
      const stat = stats[key] || { total: 0, remaining: 0 };
      stat.total++;
      stats[key] = stat;

      if (base) {
        const gx = base.posX + ov.offsetX + x;
        const gy = base.posY + ov.offsetY + y;
        const tx = base.chunk1 + Math.floor(gx / TILE_SIZE);
        const ty = base.chunk2 + Math.floor(gy / TILE_SIZE);
        neededTiles.add(`${tx},${ty}`);
      }
    }
  }

  if (base) {
    const tileCache = new Map<string, Uint8ClampedArray>();
    const tilePromises = Array.from(neededTiles).map(async key => {
      const [tx, ty] = key.split(',').map(n => parseInt(n, 10));
      try {
        const url = `https://backend.wplace.live/files/s0/tiles/${tx}/${ty}.png`;
        const tileImg = await loadImage(url);
        const tileCanvas = createCanvas(tileImg.width, tileImg.height) as HTMLCanvasElement;
        const tctx = tileCanvas.getContext('2d', { willReadFrequently: true })!;
        tctx.drawImage(tileImg, 0, 0);
        const tdata = tctx.getImageData(0, 0, tileImg.width, tileImg.height).data;
        tileCache.set(key, tdata);
      } catch (e) {
        console.warn('Overlay Pro: failed to load tile', key, e);
      }
    });
    await Promise.all(tilePromises);

    // Second pass – compute remaining pixels
    for (let y = 0; y < hImg; y++) {
      for (let x = 0; x < wImg; x++) {
        const idx = (y * wImg + x) * 4;
        const a = data[idx + 3];
        if (a === 0) continue;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        if (r === 0xde && g === 0xfa && b === 0xce) continue;
        const key = `${r},${g},${b}`;

        const gx = base.posX + ov.offsetX + x;
        const gy = base.posY + ov.offsetY + y;
        const tx = base.chunk1 + Math.floor(gx / TILE_SIZE);
        const ty = base.chunk2 + Math.floor(gy / TILE_SIZE);
        const tileKey = `${tx},${ty}`;
        const tdata = tileCache.get(tileKey);

        let mismatch = true;
        if (tdata) {
          const px = ((gx % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
          const py = ((gy % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
          const tidx = (py * TILE_SIZE + px) * 4;
          const tr = tdata[tidx], tg = tdata[tidx + 1], tb = tdata[tidx + 2];
          if (r === tr && g === tg && b === tb) mismatch = false;
        }
        if (mismatch) stats[key].remaining++;
      }
    }
  } else {
    // No anchor set – everything is considered remaining
    for (const key of Object.keys(stats)) stats[key].remaining = stats[key].total;
  }

  ov.colorStats = stats;
  const filter: Record<string, boolean> = {};
  for (const k of Object.keys(stats)) filter[k] = true;
  ov.colorFilter = filter;
}
