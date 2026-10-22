// Loads the JSON content files and renders every section that depends on them.
import { openLightbox } from './lightbox.js';
import { initMap } from './map.js';

async function loadJSON(path, optional = false) {
  const res = await fetch(path);
  if (!res.ok) { if (optional) return null; throw new Error(`${path}: ${res.status}`); }
  return res.json();
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}
function icon(id, cls = 'icon') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}
function setText(selector, value) {
  document.querySelectorAll(selector).forEach((n) => { n.textContent = value; });
}

export function renderSite(site) {
  setText('[data-field="name"]', site.name);
  setText('[data-field="location"]', site.location || '—');
  setText('[data-field="role"]', site.role || '—');
  setText('[data-field="adventureStarted"]', site.adventureStarted || '—');
  setText('[data-field="languages"]', (site.languages || []).join(', ') || '—');
  setText('[data-field="tagline"]', site.tagline || '');
  setText('[data-field="bio"]', site.bio || '');
  const greeting = document.querySelector('[data-greeting]');
  if (greeting && site.greeting) greeting.textContent = site.greeting;

  const badges = document.querySelector('[data-badges]');
  if (badges) {
    badges.replaceChildren();
    for (let i = 0; i < 8; i++) {
      const b = site.badges?.[i];
      const slot = el('span', b ? 'slot' : 'slot slot--empty');
      if (b) {
        slot.append(icon(`i-badge-${b.icon || 'star'}`));
        slot.title = b.year ? `${b.label} (${b.year})` : b.label;
        slot.setAttribute('role', 'img');
        slot.setAttribute('aria-label', slot.title);
      } else {
        slot.setAttribute('aria-hidden', 'true');
      }
      badges.append(slot);
    }
  }

  // contact
  const email = document.querySelector('[data-contact-email]');
  if (email) {
    const parts = site.emailParts || [];
    if (parts.length === 2) {
      const addr = `${parts[0]}@${parts[1]}`;
      email.href = `mailto:${addr}`;
      email.title = addr;
    } else {
      email.hidden = true;
    }
  }
  const linkedin = document.querySelector('[data-contact-linkedin]');
  if (linkedin) { if (site.linkedin) linkedin.href = site.linkedin; else linkedin.hidden = true; }
  const github = document.querySelector('[data-contact-github]');
  if (github && site.github) github.href = site.github;

  // cv links
  document.querySelectorAll('[data-cv-link]').forEach((a) => {
    if (site.cv?.file) { a.href = site.cv.file; a.setAttribute('download', ''); }
  });
  const label = document.querySelector('[data-cv-label]');
  if (label && site.cv?.label) label.textContent = site.cv.label;
  const alternates = document.querySelector('[data-cv-alternates]');
  if (alternates) {
    alternates.replaceChildren();
    for (const alt of site.cv?.alternates || []) {
      const a = el('a', 'btn', alt.label);
      a.href = alt.file;
      a.setAttribute('download', '');
      a.prepend(icon('i-download'));
      alternates.append(a);
    }
  }
}

export function renderInterests(items) {
  const host = document.querySelector('[data-interests]');
  if (!host) return;
  host.replaceChildren();
  for (const it of items || []) {
    const art = el('article', 'box interest');
    art.id = `interest-${it.id}`;
    const h = el('h3', 'interest__title', it.title);
    art.append(h);
    if (it.blurb) art.append(el('p', 'interest__blurb', it.blurb));
    const photos = it.photos || [];
    const grid = el('div', `interest__photos${photos.length === 1 ? ' interest__photos--1' : ''}`);
    photos.forEach((p, i) => {
      const fig = el('figure', 'photo');
      const frame = el('div', 'album-frame');
      const btn = el('button', 'album-frame__btn');
      btn.type = 'button';
      btn.setAttribute('aria-label', `Open photo: ${p.alt || it.title}`);
      const img = el('img');
      img.src = p.src;
      img.alt = p.alt || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 400; img.height = 300;
      btn.append(img);
      btn.addEventListener('click', () => openLightbox(photos, i));
      frame.append(btn);
      fig.append(frame);
      if (p.caption) fig.append(el('figcaption', 'photo__caption', p.caption));
      grid.append(fig);
    });
    art.append(grid);
    host.append(art);
  }
}

export function renderProjects(items) {
  const host = document.querySelector('[data-projects]');
  if (!host) return;
  host.replaceChildren();
  for (const p of items || []) {
    const art = el('article', 'box project');
    if (p.image) {
      const fig = el('div', 'album-frame project__image');
      const img = el('img'); img.src = p.image; img.alt = p.imageAlt || ''; img.loading = 'lazy'; img.width = 640; img.height = 360;
      fig.append(img); art.append(fig);
    }
    const h = el('h3', 'project__name');
    if (p.url) {
      const a = el('a', '', p.name);
      a.href = p.url; a.rel = 'noopener'; a.target = '_blank';
      a.append(icon('i-external'));
      h.append(a);
    } else h.textContent = p.name;
    art.append(h);
    if (p.blurb) art.append(el('p', 'project__blurb', p.blurb));
    const meta = el('div', 'project__meta');
    const tags = el('ul', 'tags');
    (p.tags || []).forEach((t) => tags.append(el('li', 'tag', t)));
    meta.append(tags);
    if (p.year) meta.append(el('span', 'project__year', String(p.year)));
    art.append(meta);
    host.append(art);
  }
}

export async function renderCV(cv) {
  const status = document.querySelector('[data-cv-status]');
  if (!status) return;
  const meta = await loadJSON('cv/meta.json', true).catch(() => null);
  const link = document.querySelector('.cv-box [data-cv-link]');
  if (meta?.updated) {
    const kb = meta.bytes ? ` · ${Math.max(1, Math.round(meta.bytes / 1024))} KB` : '';
    status.textContent = `Last updated ${meta.updated}${kb}. Generated from the Overleaf source automatically.`;
    link?.removeAttribute('aria-disabled');
  } else {
    status.textContent = 'The PDF is published automatically from Overleaf. The first build has not run yet.';
    link?.setAttribute('aria-disabled', 'true');
  }
}

export async function loadAll() {
  const [site, interests, projects, visited, countries] = await Promise.all([
    loadJSON('data/site.json'),
    loadJSON('data/interests.json'),
    loadJSON('data/projects.json'),
    loadJSON('data/visited.json'),
    loadJSON('data/countries.json'),
  ]);
  renderSite(site);
  renderInterests(interests.items);
  renderProjects(projects.items);
  await Promise.all([renderCV(site.cv), initMap(visited, countries)]);
}
