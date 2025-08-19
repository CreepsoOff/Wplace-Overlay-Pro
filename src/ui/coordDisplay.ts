import { showToast } from '../core/toast';

let target: HTMLElement | null = null;
let container: HTMLSpanElement | null = null;
let textEl: HTMLSpanElement | null = null;
let copyBtn: HTMLButtonElement | null = null;

export function updatePixelCoords(chunk1: number, chunk2: number, posX: number, posY: number) {
  const dispX = ((chunk1 % 4) * 1000) + posX;
  const dispY = ((chunk2 % 4) * 1000) + posY;

  if (!target) {
    const txt = `${dispX}, ${dispY}`;
    const span = Array.from(document.querySelectorAll('span'))
      .find(s => s.textContent?.trim().includes(txt));
    target = span?.parentElement?.parentElement?.parentElement || null;
  }

  if (!target) return;

  if (!container) {
    container = document.createElement('span');
    container.id = 'op-display-coords';
    (container.style as any).marginLeft = 'calc(var(--spacing)*3)';
    container.style.fontSize = 'small';

    textEl = document.createElement('span');

    copyBtn = document.createElement('button');
    copyBtn.id = 'op-copy-coords';
    copyBtn.title = 'Copier les coordonnées';
    copyBtn.style.marginLeft = 'var(--spacing)';
    copyBtn.style.background = 'none';
    copyBtn.style.border = 'none';
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.padding = '0';
    copyBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

    container.appendChild(textEl);
    container.appendChild(copyBtn);
    target.insertAdjacentElement('afterend', container);
  }

  if (textEl) {
    textEl.textContent = `(Tl X: ${chunk1}, Tl Y: ${chunk2}, Px X: ${posX}, Px Y: ${posY})`;
  }

  if (copyBtn) {
    copyBtn.onclick = () =>
      navigator.clipboard
        .writeText(`${chunk1} ${chunk2} ${posX} ${posY}`)
        .then(() => showToast('Coordinates copied successfully ✅', 'success'));
  }
}

