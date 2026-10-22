// Visited-country map: inlines the dot-map SVG, lights visited countries, shows stats and continent
// lists, highlights a continent on hover, replays the visits, and names a country on click.
import { play } from './sound.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function initMap(visited, countries) {
  const host = document.querySelector('[data-map]');
  if (!host) return;
  const svgText = await fetch('assets/img/world-dots.svg').then((r) => { if (!r.ok) throw new Error('map missing'); return r.text(); });
  host.insertAdjacentHTML('afterbegin', svgText);
  const svg = host.querySelector('svg');
  const set = new Set((visited.countries || []).map((c) => c.toUpperCase()));
  const nameOf = (iso) => countries[iso]?.name || iso;
  const contOf = (iso) => countries[iso]?.continent || 'Elsewhere';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lands = new Map();
  svg.querySelectorAll('.land').forEach((p) => {
    const iso = p.dataset.iso;
    lands.set(iso, p);
    const isVisited = set.has(iso);
    p.classList.toggle('is-visited', isVisited);
    const title = p.querySelector('title');
    if (title) title.textContent = `${p.dataset.name}${isVisited ? ' (visited)' : ''}`;
  });

  // tooltip
  const tip = host.querySelector('.map__tooltip') || host.appendChild(el('div', 'map__tooltip'));
  tip.hidden = true;
  let hideTimer = 0;
  const place = (e, land) => {
    const r = host.getBoundingClientRect();
    const isVisited = set.has(land.dataset.iso);
    tip.textContent = isVisited ? `${land.dataset.name} · visited` : land.dataset.name;
    tip.classList.toggle('is-visited', isVisited);
    tip.hidden = false;
    const x = Math.min(r.width - tip.offsetWidth - 8, Math.max(4, e.clientX - r.left + 14));
    const y = Math.max(4, e.clientY - r.top - 34);
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  };
  host.addEventListener('pointermove', (e) => {
    const land = e.target.closest('.land');
    if (land) place(e, land); else tip.hidden = true;
  });
  host.addEventListener('pointerleave', () => { tip.hidden = true; });
  host.addEventListener('pointerdown', (e) => {
    const land = e.target.closest('.land');
    if (!land || e.pointerType === 'mouse') return;
    place(e, land);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { tip.hidden = true; }, 1800);
  });

  // click: name the country in the info box
  const info = document.querySelector('[data-map-info]');
  host.addEventListener('click', (e) => {
    const land = e.target.closest('.land');
    if (!land || !info) return;
    const iso = land.dataset.iso;
    const visitedText = set.has(iso) ? 'visited' : 'not yet';
    info.textContent = `${land.dataset.name} · ${contOf(iso)} · ${visitedText}`;
    info.hidden = false;
    play('select');
  });

  // stats
  const n = set.size;
  const denominator = Number(visited.denominator) || 195;
  const pct = n ? Math.round((n / denominator) * 1000) / 10 : 0;
  const byContinent = new Map();
  for (const iso of set) {
    const cont = contOf(iso);
    if (!byContinent.has(cont)) byContinent.set(cont, []);
    byContinent.get(cont).push(iso);
  }
  const order = [...byContinent.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  order.forEach(([, isos]) => isos.sort((a, b) => nameOf(a).localeCompare(nameOf(b))));

  const stats = document.querySelector('[data-map-stats]');
  if (stats) {
    stats.replaceChildren();
    const add = (value, label) => {
      const s = el('div', 'box stat');
      s.append(el('span', 'stat__value', value), el('span', 'stat__label', label));
      stats.append(s);
    };
    add(String(n), n === 1 ? 'country' : 'countries');
    add(`${pct}%`, 'of the world');
    add(String(byContinent.size), byContinent.size === 1 ? 'continent' : 'continents');
    if (visited.updated) add(visited.updated, 'last update');
  }

  // continent lists with hover focus
  let pinned = null;
  const setFocus = (cont) => {
    host.classList.toggle('has-focus', Boolean(cont));
    lands.forEach((p, iso) => p.classList.toggle('is-focus', Boolean(cont) && set.has(iso) && contOf(iso) === cont));
    document.querySelectorAll('.map-list__btn').forEach((b) => b.classList.toggle('is-on', b.dataset.continent === cont));
  };
  const lists = document.querySelector('[data-map-lists]');
  if (lists) {
    lists.replaceChildren();
    for (const [cont, isos] of order) {
      const sec = el('section', 'map-list');
      const h = el('h3');
      const btn = el('button', 'map-list__btn');
      btn.type = 'button';
      btn.dataset.continent = cont;
      btn.setAttribute('aria-pressed', 'false');
      btn.append(document.createTextNode(cont + ' '), el('span', '', String(isos.length)));
      btn.addEventListener('mouseenter', () => { if (!pinned) setFocus(cont); });
      btn.addEventListener('mouseleave', () => { if (!pinned) setFocus(null); });
      btn.addEventListener('focus', () => { if (!pinned) setFocus(cont); });
      btn.addEventListener('blur', () => { if (!pinned) setFocus(null); });
      btn.addEventListener('click', () => {
        pinned = pinned === cont ? null : cont;
        document.querySelectorAll('.map-list__btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.continent === pinned)));
        setFocus(pinned);
        play('select');
      });
      h.append(btn);
      const ul = el('ul');
      isos.forEach((iso) => ul.append(el('li', '', nameOf(iso))));
      sec.append(h, ul);
      lists.append(sec);
    }
  }

  // replay: light the visited countries up one by one
  const replayBtn = document.querySelector('[data-map-replay]');
  let replaying = false;
  if (replayBtn) {
    replayBtn.hidden = n === 0;
    replayBtn.addEventListener('click', async () => {
      if (replaying) return;
      replaying = true;
      const seq = order.flatMap(([, isos]) => isos).map((iso) => lands.get(iso)).filter(Boolean);
      if (!reduce) {
        seq.forEach((p) => p.classList.remove('is-visited'));
        await sleep(250);
        for (const p of seq) { p.classList.add('is-visited'); play('select'); await sleep(Math.max(45, 900 / seq.length)); }
      }
      play('confirm');
      replaying = false;
    });
  }

  const note = document.querySelector('[data-map-note]');
  if (note) note.hidden = !visited.placeholder;

  return { countries: n, continents: byContinent.size };
}
