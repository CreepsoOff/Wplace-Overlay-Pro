/// <reference types="tampermonkey" />

export function updatePixelCoords(chunk1: number, chunk2: number, posX: number, posY: number) {
  const conv = (unsafeWindow as any)?.serverTPtoDisplayTP?.(chunk1, chunk2, posX, posY);
  if (!conv) return;

  const tlX = conv.chunk1 ?? 0;
  const tlY = conv.chunk2 ?? 0;
  const pxX = conv.posX ?? 0;
  const pxY = conv.posY ?? 0;

  let span = document.getElementById('op-display-coords') as HTMLSpanElement | null;
  if (!span) {
    span = document.createElement('span');
    span.id = 'op-display-coords';
    const pixelLabel = Array.from(document.querySelectorAll('span')).find(el => (el.textContent || '').startsWith('Pixel'));
    if (pixelLabel && pixelLabel.parentNode) {
      pixelLabel.parentNode.insertBefore(span, pixelLabel.nextSibling);
    } else {
      document.body.appendChild(span);
    }
  }

  span.textContent = `(Tl X: ${tlX}, Tl Y: ${tlY}, Px X: ${pxX}, Px Y: ${pxY})`;
}

export default updatePixelCoords;
