import { createCanvas, loadImage } from './canvas';
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
  const data = ctx.getImageData(0,0,img.width,img.height).data;
  const stats: Record<string, number> = {};
  for (let i=0;i<data.length;i+=4) {
    const a = data[i+3];
    if (a === 0) continue;
    const r = data[i], g = data[i+1], b = data[i+2];
    // Skip #deface transparency color
    if (r === 0xde && g === 0xfa && b === 0xce) continue;
    const key = `${r},${g},${b}`;
    stats[key] = (stats[key]||0)+1;
  }
  ov.colorStats = stats;
  const filter: Record<string, boolean> = {};
  for (const k of Object.keys(stats)) filter[k] = true;
  ov.colorFilter = filter;
}
