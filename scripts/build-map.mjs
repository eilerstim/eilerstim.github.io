#!/usr/bin/env node
// Rasterises Natural Earth country polygons into a pixel dot-map.
// Output: assets/img/world-dots.svg (one <path data-iso> per country) and data/countries.json
// (ISO alpha-2 -> name, continent). Natural Earth data is public domain.
// Run: node scripts/build-map.mjs [--step 1.5]   (downloads the GeoJSON into scripts/.cache on first run)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = join(root, 'scripts/.cache');
const SRC = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
const args = process.argv.slice(2);
const STEP = Number(args[args.indexOf('--step') + 1] || 0) || 1.5; // degrees per cell
const LAT_TOP = 84, LAT_BOTTOM = -57; // Antarctica is left out
const COLS = Math.round(360 / STEP);
const ROWS = Math.round((LAT_TOP - LAT_BOTTOM) / STEP);

// Hand-picked names for codes whose Natural Earth name is abbreviated.
const NAME_FIX = {
  US: 'United States', GB: 'United Kingdom', AE: 'United Arab Emirates', CZ: 'Czechia',
  BA: 'Bosnia and Herzegovina', CF: 'Central African Republic', CD: 'DR Congo', CG: 'Republic of the Congo',
  DO: 'Dominican Republic', GQ: 'Equatorial Guinea', SS: 'South Sudan', EH: 'Western Sahara',
  LA: 'Laos', KR: 'South Korea', KP: 'North Korea', SB: 'Solomon Islands', FK: 'Falkland Islands',
  TF: 'French Southern Territories', PS: 'Palestine', VA: 'Vatican City', SH: 'Saint Helena',
  VC: 'Saint Vincent and the Grenadines', KN: 'Saint Kitts and Nevis', PM: 'Saint Pierre and Miquelon',
  BL: 'Saint Barthélemy', MF: 'Saint Martin', SX: 'Sint Maarten', TC: 'Turks and Caicos Islands',
  VI: 'US Virgin Islands', VG: 'British Virgin Islands', AS: 'American Samoa', MP: 'Northern Mariana Islands',
  FM: 'Micronesia', TL: 'Timor-Leste', BN: 'Brunei', SZ: 'Eswatini', TR: 'Türkiye', MK: 'North Macedonia',
  HM: 'Heard and McDonald Islands', IO: 'British Indian Ocean Territory', PN: 'Pitcairn Islands',
  CK: 'Cook Islands', WF: 'Wallis and Futuna', PF: 'French Polynesia', NC: 'New Caledonia',
  GS: 'South Georgia and the South Sandwich Islands', SJ: 'Svalbard and Jan Mayen', AX: 'Åland Islands',
  BQ: 'Caribbean Netherlands', CW: 'Curaçao', KY: 'Cayman Islands', BM: 'Bermuda', GL: 'Greenland',
  FO: 'Faroe Islands', IM: 'Isle of Man', JE: 'Jersey', GG: 'Guernsey', GI: 'Gibraltar', HK: 'Hong Kong',
  MO: 'Macao', NF: 'Norfolk Island', CX: 'Christmas Island', CC: 'Cocos Islands', AQ: 'Antarctica',
};

const CONTINENT_FIX = { MV: 'Asia', IO: 'Asia', HM: 'Oceania', SC: 'Africa', MU: 'Africa', TF: 'Africa', SH: 'Africa' };

mkdirSync(cache, { recursive: true });
const file = join(cache, 'ne_50m_admin_0_countries.geojson');
if (!existsSync(file)) {
  console.log('downloading Natural Earth 50m countries...');
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}
const geo = JSON.parse(readFileSync(file, 'utf8'));

// --- geometry helpers ---
function ringBBox(ring) {
  let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
  for (const [x, y] of ring) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return [x0, y0, x1, y1];
}
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inPolygon(x, y, poly) {
  if (!inRing(x, y, poly.rings[0])) return false;
  for (let k = 1; k < poly.rings.length; k++) if (inRing(x, y, poly.rings[k])) return false;
  return true;
}

// --- features -> polygons with bboxes ---
const countries = [];
for (const f of geo.features) {
  const p = f.properties;
  if (p.CONTINENT === 'Antarctica') continue;
  let iso = /^[A-Z]{2}$/.test(p.ISO_A2_EH || '') ? p.ISO_A2_EH : (/^[A-Z]{2}$/.test(p.ISO_A2 || '') ? p.ISO_A2 : null);
  const geoms = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const polys = geoms.map((rings) => ({ rings, bbox: ringBBox(rings[0]) }));
  countries.push({
    iso, name: (iso && NAME_FIX[iso]) || p.NAME_EN || p.NAME || p.ADMIN,
    continent: (iso && CONTINENT_FIX[iso]) || (p.CONTINENT === 'Seven seas (open ocean)' ? 'Africa' : p.CONTINENT),
    polys, cells: [],
  });
}

// --- rasterise: one owner per cell ---
const owner = new Int16Array(COLS * ROWS).fill(-1);
for (let r = 0; r < ROWS; r++) {
  const lat = LAT_TOP - (r + 0.5) * STEP;
  for (let c = 0; c < COLS; c++) {
    const lon = -180 + (c + 0.5) * STEP;
    for (let i = 0; i < countries.length; i++) {
      const ct = countries[i];
      let hit = false;
      for (const poly of ct.polys) {
        const [x0, y0, x1, y1] = poly.bbox;
        if (lon < x0 || lon > x1 || lat < y0 || lat > y1) continue;
        if (inPolygon(lon, lat, poly)) { hit = true; break; }
      }
      if (hit) { owner[r * COLS + c] = i; break; }
    }
  }
}
// Every country gets at least one cell (microstates fall between sample points).
let forced = 0;
countries.forEach((ct, i) => {
  if (owner.includes(i)) return;
  const big = ct.polys.reduce((a, b) => ((b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) > (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]) ? b : a));
  const ring = big.rings[0];
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const c = Math.min(COLS - 1, Math.max(0, Math.floor((cx + 180) / STEP)));
  const r = Math.min(ROWS - 1, Math.max(0, Math.floor((LAT_TOP - cy) / STEP)));
  if (r < 0 || r >= ROWS) return;
  owner[r * COLS + c] = i;
  forced++;
});
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const i = owner[r * COLS + c];
  if (i >= 0) countries[i].cells.push([c, r]);
}

// --- SVG ---
const INSET = 0.12, SIZE = (1 - 2 * INSET).toFixed(2);
const parts = [];
for (const ct of countries) {
  if (!ct.cells.length) continue;
  // Integer cell coordinates; the inset is applied once by the group transform.
  const d = ct.cells.map(([c, r]) => `M${c} ${r}h${SIZE}v${SIZE}h-${SIZE}z`).join('');
  const iso = ct.iso || 'XX';
  const name = ct.name.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  parts.push(`<path class="land" data-iso="${iso}" data-name="${name}" d="${d}"><title>${name}</title></path>`);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COLS} ${ROWS}" shape-rendering="crispEdges" role="img" aria-labelledby="map-title">
<title id="map-title">World map of visited countries</title>
<g class="land-group" transform="translate(${INSET} ${INSET})">${parts.join('\n')}</g>
</svg>
`;
mkdirSync(join(root, 'assets/img'), { recursive: true });
writeFileSync(join(root, 'assets/img/world-dots.svg'), svg);

// --- country table ---
const table = {};
for (const ct of countries) {
  if (!ct.iso || ct.iso === 'XX') continue;
  if (table[ct.iso]) continue;
  table[ct.iso] = { name: ct.name, continent: ct.continent };
}
const sorted = Object.fromEntries(Object.entries(table).sort(([, a], [, b]) => a.name.localeCompare(b.name)));
mkdirSync(join(root, 'data'), { recursive: true });
const lines = Object.entries(sorted).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
writeFileSync(join(root, 'data/countries.json'), `{\n${lines.join(',\n')}\n}\n`);

const cellsTotal = countries.reduce((s, c) => s + c.cells.length, 0);
console.log(`grid ${COLS}x${ROWS} (step ${STEP}°), ${countries.length} features, ${cellsTotal} land cells, ${forced} forced microstate cells, ${Object.keys(sorted).length} ISO codes, svg ${(svg.length / 1024).toFixed(0)} KB`);
