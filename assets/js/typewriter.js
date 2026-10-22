// Types dialog text out when the box scrolls into view. Click to finish at once. Instant under reduced motion.
export function initTypewriter(root = document) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.querySelectorAll('[data-typewriter]:not([data-typewriter-ready])').forEach((box) => {
    box.setAttribute('data-typewriter-ready', '');
    const el = box.querySelector('.dialog__text');
    if (!el) return;
    const full = el.textContent.trim();
    if (reduce || !full) { box.classList.add('is-done'); return; }

    const sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = full;
    el.before(sr);
    el.setAttribute('aria-hidden', 'true');
    el.textContent = '';
    box.classList.add('is-typing');

    let i = 0;
    let timer = 0;
    const done = () => {
      clearTimeout(timer);
      el.textContent = full;
      box.classList.remove('is-typing');
      box.classList.add('is-done');
    };
    const step = () => {
      i++;
      el.textContent = full.slice(0, i);
      if (i >= full.length) { done(); return; }
      const ch = full[i - 1];
      timer = setTimeout(step, ch === '.' || ch === '!' || ch === '?' ? 260 : ch === ',' ? 120 : 26);
    };
    box.addEventListener('click', () => { if (box.classList.contains('is-typing')) done(); });

    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); timer = setTimeout(step, 350); }
    }, { threshold: 0.3 });
    io.observe(box);
  });
}
