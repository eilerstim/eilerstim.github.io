import { play } from './sound.js';

let gallery = [];
let index = 0;
let dlg, img, cap, count, prev, next;

function show(i) {
  index = (i + gallery.length) % gallery.length;
  const p = gallery[index];
  img.src = p.src;
  img.alt = p.alt || '';
  cap.textContent = p.caption || '';
  count.textContent = gallery.length > 1 ? `${index + 1} / ${gallery.length}` : '';
  prev.hidden = next.hidden = gallery.length < 2;
}

export function openLightbox(photos, i = 0) {
  if (!dlg || !photos.length) return;
  gallery = photos;
  show(i);
  if (!dlg.open) dlg.showModal();
}

export function initLightbox() {
  dlg = document.getElementById('lightbox');
  if (!dlg) return;
  img = dlg.querySelector('.lightbox__img');
  cap = dlg.querySelector('.lightbox__caption');
  count = dlg.querySelector('.lightbox__count');
  prev = dlg.querySelector('[data-lightbox-prev]');
  next = dlg.querySelector('[data-lightbox-next]');
  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  dlg.querySelector('[data-lightbox-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  dlg.addEventListener('close', () => { play('back'); img.removeAttribute('src'); });
}
