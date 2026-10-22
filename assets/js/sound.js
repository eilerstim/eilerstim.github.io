// Opt-in 8-bit blips synthesised with WebAudio. Nothing plays until the visitor turns sound on.
const KEY = 'sfx';
let ctx = null;
let enabled = false;

const SEQUENCES = {
  select: [[1046, 0.045]],
  confirm: [[784, 0.06], [1175, 0.09]],
  back: [[1175, 0.06], [784, 0.09]],
};

function read() { try { return localStorage.getItem(KEY) === 'on'; } catch { return false; } }
function write(on) { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode */ } }

function sync(btn) {
  btn.setAttribute('aria-pressed', String(enabled));
  btn.classList.toggle('is-on', enabled);
  btn.title = enabled ? 'Sound on' : 'Sound off';
}

export function play(name) {
  if (!enabled) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    let t = ctx.currentTime;
    for (const [freq, dur] of SEQUENCES[name] || SEQUENCES.select) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.07, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur;
    }
  } catch { /* audio unavailable */ }
}

export function initSound() {
  enabled = read();
  const toggles = document.querySelectorAll('[data-sfx-toggle]');
  toggles.forEach((btn) => {
    sync(btn);
    btn.addEventListener('click', () => {
      enabled = !enabled;
      write(enabled);
      toggles.forEach(sync);
      if (enabled) play('confirm');
    });
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('a.btn, button.btn, .nav-link');
    if (!t || t.hasAttribute('data-sfx-toggle')) return;
    play(t.hasAttribute('download') ? 'confirm' : 'select');
  });
}
