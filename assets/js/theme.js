// Time of day drives the hero scene (morning, day, evening, night) and the UI theme (night = dark).
// "Now" mode follows the real sun where the visitor is (place guessed from the time zone, no
// permission asked): phases switch at the actual dawn, sunrise, sunset and dusk, and the sun or moon
// sits where it really is. A system dark preference keeps the night look.
// The toggle cycles Now → Morning → Day → Evening → Night. ?theme=... forces a phase, ?at=<ISO time>
// previews another moment, e.g. ?at=2026-06-21T21:10
import { toast } from './nav.js';
import { skyState, MANUAL } from './sun.js';
import { guessPlace } from './geo.js';

const PHASES = ['morning', 'day', 'evening', 'night'];
const CYCLE = ['auto', ...PHASES];
const LABELS = { auto: 'Now', morning: 'Morning', day: 'Day', evening: 'Evening', night: 'Night' };
const KEY = 'tod';

function stored() { try { return localStorage.getItem(KEY); } catch { return null; } }
function store(v) { try { if (v === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch { /* ignore */ } }

export function initTheme() {
  const html = document.documentElement;
  const scene = document.querySelector('.scene');
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const params = new URLSearchParams(location.search);
  const param = params.get('theme');
  const atParam = params.get('at');
  const fixed = atParam ? new Date(atParam) : null;
  const now = () => (fixed && !Number.isNaN(fixed.getTime()) ? fixed : new Date());
  const place = guessPlace();

  let mode;
  if (PHASES.includes(param)) mode = param;
  else if (param === 'dark') mode = 'night';
  else if (param === 'light') mode = 'day';
  else { const s = stored(); mode = PHASES.includes(s) ? s : 'auto'; }

  const toggles = document.querySelectorAll('[data-tod-toggle]');
  const paint = (phase, pos, label) => {
    html.dataset.time = phase;
    html.dataset.theme = phase === 'night' ? 'dark' : 'light';
    if (scene && pos) {
      scene.style.setProperty('--sun-x', pos.x.toFixed(1));
      scene.style.setProperty('--sun-y', pos.y.toFixed(3));
    }
    toggles.forEach((b) => { b.setAttribute('aria-label', `Time of day: ${label}. Change it.`); b.title = label; });
    return label;
  };
  const render = () => {
    if (mode !== 'auto') return paint(mode, MANUAL[mode], LABELS[mode]);
    const sky = skyState(now(), place);
    if (mq.matches && !fixed) {
      return paint('night', sky.phase === 'night' ? { x: sky.x, y: sky.y } : MANUAL.night, 'Now: night (your system prefers dark)');
    }
    return paint(sky.phase, { x: sky.x, y: sky.y }, `Now: ${LABELS[sky.phase].toLowerCase()} in ${place.name}`);
  };
  render();

  toggles.forEach((btn) => btn.addEventListener('click', () => {
    mode = CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length];
    store(mode);
    toast(render());
  }));
  mq.addEventListener('change', render);
  setInterval(() => { if (mode === 'auto') render(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && mode === 'auto') render(); });
}
