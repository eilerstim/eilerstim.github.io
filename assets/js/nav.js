// Navigation prototype switch and the mobile toggle of the top menu.
// Modes: auto (top menu on wide screens, bottom bar on narrow ones), top, bottom.
// Switch with ?nav=top|bottom|auto or by pressing Shift+N three times.
const MODES = ['auto', 'top', 'bottom'];
const KEY = 'nav';

function readStored() { try { return localStorage.getItem(KEY); } catch { return null; } }
function store(mode) { try { localStorage.setItem(KEY, mode); } catch { /* ignore */ } }

export function toast(message, ms = 1800) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const el = document.createElement('div');
  el.className = 'box toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), ms);
}

export function initNav() {
  const html = document.documentElement;
  const param = new URLSearchParams(location.search).get(KEY);
  let mode = MODES.includes(param) ? param : readStored();
  if (!MODES.includes(mode)) mode = 'auto';
  const apply = (m) => { mode = m; html.dataset.nav = m; store(m); };
  apply(mode);

  let presses = [];
  document.addEventListener('keydown', (e) => {
    if (!(e.shiftKey && e.key === 'N')) return;
    const now = Date.now();
    presses = presses.filter((t) => now - t < 2000);
    presses.push(now);
    if (presses.length >= 3) {
      presses = [];
      apply(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
      toast(`Navigation: ${mode}`);
    }
  });

  const top = document.getElementById('nav-top');
  const toggle = top?.querySelector('.nav-top__toggle');
  if (top && toggle) {
    toggle.addEventListener('click', () => {
      const open = top.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    top.querySelectorAll('.nav-link').forEach((a) => a.addEventListener('click', () => {
      top.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }
}
