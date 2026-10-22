import { play } from './sound.js';

// Konami code: switches the card to its black tier for this visit.
const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

function activate(fresh) {
  document.documentElement.dataset.easter = 'black';
  try { sessionStorage.setItem('easter', 'black'); } catch { /* ignore */ }
  if (!fresh) return;
  play('confirm');
  const host = document.querySelector('[data-easter-slot]');
  if (host && !host.querySelector('.easter')) {
    const box = document.createElement('div');
    box.className = 'box box--dialog easter is-done';
    box.setAttribute('role', 'status');
    box.innerHTML = '<p class="dialog__text">Secret found. The black card is yours for this visit.</p>' +
      '<span class="dialog__arrow" aria-hidden="true"><svg class="icon"><use href="#i-arrow"/></svg></span>';
    host.append(box);
  }
}

export function initEaster() {
  try { if (sessionStorage.getItem('easter') === 'black') activate(false); } catch { /* ignore */ }
  let pos = 0;
  document.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === SEQ[pos]) {
      pos++;
      if (pos === SEQ.length) { pos = 0; activate(true); }
    } else {
      pos = k === SEQ[0] ? 1 : 0;
    }
  });
}
