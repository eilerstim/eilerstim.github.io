// Parallax for the hero scene layers (eased, so wheel steps glide) and the bouncing scroll hint.
export function initScene() {
  const scene = document.querySelector('.scene');
  const hint = document.querySelector('.hero__hint');
  if (!scene) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let target = 0;
  let current = 0;
  let raf = 0;
  const step = () => {
    current += (target - current) * 0.14;
    if (Math.abs(target - current) < 0.1) { current = target; raf = 0; } else raf = requestAnimationFrame(step);
    scene.style.setProperty('--scroll', current.toFixed(2));
  };
  const onScroll = () => {
    const y = window.scrollY;
    if (hint) hint.classList.toggle('is-hidden', y > 80);
    if (reduce) return;
    target = Math.min(y, 1400);
    if (!raf) raf = requestAnimationFrame(step);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
