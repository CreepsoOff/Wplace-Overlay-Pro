import { createCanvas, loadImage } from './canvas';
import { WPLACE_NAMES } from './palette';

export async function analyzeImageColors(base64: string): Promise<Record<string, number>> {
  const img = await loadImage(base64);
  const canvas = createCanvas(img.width, img.height) as HTMLCanvasElement;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  const counts: Record<string, number> = {};
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a === 0) continue;
    if (r === 0xde && g === 0xfa && b === 0xce) continue;
    const key = `${r},${g},${b}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function keyToHex(key: string): string {
  const [r, g, b] = key.split(',').map(n => Number(n));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function keyToName(key: string): string {
  return WPLACE_NAMES[key] || keyToHex(key);
}
