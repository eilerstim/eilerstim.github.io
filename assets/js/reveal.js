// Boxes below the hero pop in the first time they scroll into view.
export function initReveal() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  const els = document.querySelectorAll('main .section:not(.section--hero) .box');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  els.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) return; // already on screen: no animation
    el.classList.add('reveal');
    io.observe(el);
  });
}
