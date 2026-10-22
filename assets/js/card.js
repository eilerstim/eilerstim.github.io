import { play } from './sound.js';

// The trainer card flips between its front (photo and fields) and back (badges and stats).
export function initCard() {
  const card = document.querySelector('[data-card]');
  if (!card) return;
  const buttons = card.querySelectorAll('[data-card-flip]');
  const toggle = () => {
    const on = card.classList.toggle('is-flipped');
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(on)));
    play('select');
  };
  buttons.forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); toggle(); }));
  card.addEventListener('click', (e) => { if (!e.target.closest('a, button')) toggle(); });
}
