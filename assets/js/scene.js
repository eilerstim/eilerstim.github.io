// Parallax for the hero scene layers and the bouncing scroll hint.
export function initScene() {
  const scene = document.querySelector('.scene');
  const hint = document.querySelector('.hero__hint');
  if (!scene) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    if (!reduce) scene.style.setProperty('--scroll', String(Math.min(y, 1400)));
    if (hint) hint.classList.toggle('is-hidden', y > 80);
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
