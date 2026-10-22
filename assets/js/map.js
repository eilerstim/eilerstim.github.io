// Visited-country map: inlines the dot-map SVG, lights visited countries, shows stats and continent lists.
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

export async function initMap(visited, countries) {
  const host = document.querySelector('[data-map]');
  if (!host) return;
  const svgText = await fetch('assets/img/world-dots.svg').then((r) => { if (!r.ok) throw new Error('map missing'); return r.text(); });
  host.insertAdjacentHTML('afterbegin', svgText);
  const svg = host.querySelector('svg');
  const set = new Set((visited.countries || []).map((c) => c.toUpperCase()));
  const nameOf = (iso) => countries[iso]?.name || iso;

  svg.querySelectorAll('.land').forEach((p) => {
    const iso = p.dataset.iso;
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

  // stats
  const n = set.size;
  const denominator = Number(visited.denominator) || 195;
  const pct = n ? Math.round((n / denominator) * 1000) / 10 : 0;
  const byContinent = new Map();
  for (const iso of set) {
    const cont = countries[iso]?.continent || 'Elsewhere';
    if (!byContinent.has(cont)) byContinent.set(cont, []);
    byContinent.get(cont).push(nameOf(iso));
  }
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

  const lists = document.querySelector('[data-map-lists]');
  if (lists) {
    lists.replaceChildren();
    const order = [...byContinent.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    for (const [cont, names] of order) {
      const sec = el('section', 'map-list');
      const h = el('h3');
      h.append(document.createTextNode(cont + ' '), el('span', '', String(names.length)));
      const ul = el('ul');
      names.sort((a, b) => a.localeCompare(b)).forEach((name) => ul.append(el('li', '', name)));
      sec.append(h, ul);
      lists.append(sec);
    }
  }

  const note = document.querySelector('[data-map-note]');
  if (note) note.hidden = !visited.placeholder;
}
