// Scroll progress along the "route": marks the active section in every nav and moves the pixel marker
// between the section nodes. Progress is a continuous value: section index plus the fraction scrolled through it.
export function initRoute() {
  const sections = [...document.querySelectorAll('main > .section[id]')];
  const routes = [...document.querySelectorAll('[data-route]')].map((list) => ({
    list,
    links: [...list.querySelectorAll('.nav-link')],
    marker: list.querySelector('.route__marker'),
  }));
  if (!sections.length || !routes.length) return;

  let tops = [];
  const measure = () => { tops = sections.map((s) => s.getBoundingClientRect().top + window.scrollY); };

  const progress = () => {
    const n = sections.length;
    const doc = document.documentElement;
    if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) return n - 1;
    const y = window.scrollY + window.innerHeight * 0.35;
    if (y < tops[0]) return 0;
    let i = 0;
    while (i < n - 1 && y >= tops[i + 1]) i++;
    const a = tops[i];
    const b = i < n - 1 ? tops[i + 1] : a + window.innerHeight;
    return i + Math.min(1, Math.max(0, (y - a) / Math.max(1, b - a)));
  };

  const update = () => {
    const n = sections.length;
    const p = progress();
    const idx = Math.min(n - 1, Math.floor(p + 1e-6));
    for (const r of routes) {
      r.links.forEach((link, i) => {
        link.classList.toggle('is-active', i === idx);
        link.classList.toggle('is-reached', i <= idx);
        if (i === idx) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
      if (!r.marker || !r.links.length || r.list.offsetParent === null) continue;
      const base = r.list.getBoundingClientRect();
      const centers = r.links.map((l) => { const b = l.getBoundingClientRect(); return b.left - base.left + b.width / 2; });
      let x = centers[0];
      if (n > 1) {
        const i = Math.min(n - 2, Math.floor(p));
        x = centers[i] + (centers[i + 1] - centers[i]) * (p - i);
      }
      r.marker.style.transform = `translateX(${x.toFixed(1)}px)`;
    }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  };
  const refresh = () => { measure(); update(); };

  measure();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', refresh);
  window.addEventListener('load', refresh);
  if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(document.body);
  document.addEventListener('nav:changed', refresh);
}
