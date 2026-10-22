// Time of day drives the hero scene (morning, day, evening, night) and the UI theme (night = dark).
// Default: the system dark preference means night; otherwise the visitor's clock. A toggle cycles
// through the four and remembers the choice. ?theme=morning|day|evening|night|light|dark forces one.
import { toast } from './nav.js';

const TIMES = ['morning', 'day', 'evening', 'night'];
const LABELS = { morning: 'Morning', day: 'Day', evening: 'Evening', night: 'Night' };
const KEY = 'tod';

function autoTime(dark) {
  if (dark) return 'night';
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'morning';
  if (h < 17) return 'day';
  if (h < 21) return 'evening';
  return 'night';
}
function stored() { try { return localStorage.getItem(KEY); } catch { return null; } }

export function initTheme() {
  const html = document.documentElement;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const param = new URLSearchParams(location.search).get('theme');
  let time;
  if (TIMES.includes(param)) time = param;
  else if (param === 'dark') time = 'night';
  else if (param === 'light') time = 'day';
  else { const s = stored(); time = TIMES.includes(s) ? s : autoTime(mq.matches); }

  const toggles = document.querySelectorAll('[data-tod-toggle]');
  const apply = (t, persist) => {
    time = t;
    html.dataset.time = t;
    html.dataset.theme = t === 'night' ? 'dark' : 'light';
    toggles.forEach((b) => { b.setAttribute('aria-label', `Time of day: ${LABELS[t]}. Change it.`); b.title = LABELS[t]; });
    if (persist) { try { localStorage.setItem(KEY, t); } catch { /* ignore */ } }
  };
  apply(time, false);
  toggles.forEach((btn) => btn.addEventListener('click', () => {
    apply(TIMES[(TIMES.indexOf(time) + 1) % TIMES.length], true);
    toast(LABELS[time]);
  }));
  mq.addEventListener('change', (e) => { if (!stored()) apply(autoTime(e.matches), false); });
}
