#!/usr/bin/env node
// Generates every piece of pixel art for the site from ASCII grids and a few procedural tiles.
// Output: assets/img/sprite.svg   icon symbols (currentColor) + multi-colour sprites + scene patterns
//         assets/img/favicon.svg, assets/img/placeholder-*.svg
//         assets/css/pixel-art.css  9-slice frames per theme, sprite colour classes, water patterns
// Run: node scripts/gen-art.mjs && node scripts/inline-sprite.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Colours baked into frames. Keep in sync with assets/css/tokens.css.
const THEMES = {
  day: {
    ink: '#2F3A4F', soft: '#8C96A8', paper: '#FFFFFF',
    navy: '#1F2D52', navySoft: '#3A4B7A', navyLine: '#C7D2EA',
    cream: '#F4EBD3', creamInk: '#2F3A4F',
    btn: '#F3F6FA', btnHi: '#FFFFFF', btnLo: '#B9C4D6',
    slotFill: '#DCE3EE', slotLo: '#A9B5C8', slotHi: '#FFFFFF',
    water: '#5EA9DC', waterHi: '#9FD0F0',
    colors: { blue: '#3D63B8', green: '#3E9A4F', teal: '#2B8FA8', orange: '#E07B2A', purple: '#7A4FB5', pink: '#D14F8A' },
  },
  night: {
    ink: '#AFC0DF', soft: '#5C6E96', paper: '#1B2742',
    navy: '#0B1428', navySoft: '#263656', navyLine: '#8EA3CF',
    cream: '#CFC6AE', creamInk: '#2F3A4F',
    btn: '#223052', btnHi: '#3B4F7C', btnLo: '#111A30',
    slotFill: '#1A2540', slotLo: '#0C1428', slotHi: '#3A4D78',
    water: '#17304F', waterHi: '#2A4E78',
    colors: { blue: '#5B86E0', green: '#3E9A4F', teal: '#2B8FA8', orange: '#D8762A', purple: '#8A62C4', pink: '#D14F8A' },
  },
};
// highlight / shade for coloured buttons, derived per colour
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const r = ch(((n >> 16) & 255) * f + (f > 1 ? 255 * (f - 1) * 0.6 : 0));
  const g = ch(((n >> 8) & 255) * f + (f > 1 ? 255 * (f - 1) * 0.6 : 0));
  const b = ch((n & 255) * f + (f > 1 ? 255 * (f - 1) * 0.6 : 0));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ---------- helpers ----------
function parse(grid) {
  const rows = grid.replace(/^\n+|\n+$/g, '').split('\n').map((r) => r.replace(/^\s+/, ''));
  const w = rows[0].length;
  for (const r of rows) if (r.length !== w) throw new Error(`Ragged grid row "${r}" (expected width ${w})`);
  return { rows, w, h: rows.length };
}
function runs(g) {
  const d = {};
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const c = g.rows[y][x];
      let n = 1;
      while (x + n < g.w && g.rows[y][x + n] === c) n++;
      if (c !== '.') d[c] = (d[c] || '') + `M${x} ${y}h${n}v1h-${n}z`;
      x += n;
    }
  }
  return d;
}
function pathsFill(g, colours) {
  return Object.entries(runs(g)).map(([c, d]) => {
    if (colours[c] === undefined) throw new Error(`No colour for symbol "${c}"`);
    return `<path fill="${colours[c]}" d="${d}"/>`;
  }).join('');
}
function pathsClass(g, classes) {
  return Object.entries(runs(g)).map(([c, d]) => {
    if (classes[c] === undefined) throw new Error(`No class for symbol "${c}"`);
    return `<path class="px-${classes[c]}" d="${d}"/>`;
  }).join('');
}
function svg(grid, colours) {
  const g = parse(grid);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${g.w}" height="${g.h}" viewBox="0 0 ${g.w} ${g.h}" shape-rendering="crispEdges">${pathsFill(g, colours)}</svg>`;
}
function symbol(id, grid) {
  const g = parse(grid);
  return `<symbol id="${id}" viewBox="0 0 ${g.w} ${g.h}">${pathsClass(g, { '#': 'cur' })}</symbol>`;
}
function symbolMulti(id, grid, classes) {
  const g = parse(grid);
  return `<symbol id="${id}" viewBox="0 0 ${g.w} ${g.h}">${pathsClass(g, classes)}</symbol>`;
}
function pattern(id, g, classes, scale) {
  return `<pattern id="p-${id}" width="${g.w}" height="${g.h}" patternUnits="userSpaceOnUse" patternTransform="scale(${scale})">${pathsClass(g, classes)}</pattern>`;
}
function dataUri(s) {
  return `url("data:image/svg+xml,${s.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
}
function blank(w, h) { return Array.from({ length: h }, () => '.'.repeat(w)); }
function stamp(rows, sprite, x0, y0) {
  const s = parse(sprite);
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const c = s.rows[y][x];
    if (c === '.') continue;
    const yy = y0 + y, xx = ((x0 + x) % rows[0].length + rows[0].length) % rows[0].length;
    if (yy < 0 || yy >= rows.length) continue;
    rows[yy] = rows[yy].slice(0, xx) + c + rows[yy].slice(xx + 1);
  }
}
function fromRows(rows) { return parse(rows.join('\n')); }

// ---------- frames (9-slice) ----------
const BOX = `
..########..
.#wwwwwwww#.
#wwssssssww#
#wswwwwwwsw#
#wswwwwwwsw#
#wswwwwwwsw#
#wswwwwwwsw#
#wswwwwwwsw#
#wswwwwwwsw#
#wwssssssww#
.#wwwwwwww#.
..########..`;
const ALBUM = `
..############..
.#cccccccccccc#.
#cc#cccccccc#cc#
#c#cccccccccc#c#
#ccc########ccc#
#ccc#......#ccc#
#ccc#......#ccc#
#ccc#......#ccc#
#ccc#......#ccc#
#ccc#......#ccc#
#ccc#......#ccc#
#ccc########ccc#
#c#cccccccccc#c#
#cc#cccccccc#cc#
.#cccccccccccc#.
..############..`;
const BUTTON = `
.######.
#hhhhhh#
#haaaad#
#haaaad#
#haaaad#
#haaaad#
#hddddd#
.######.`;
const BUTTON_DOWN = `
.######.
#dddddd#
#daaaah#
#daaaah#
#daaaah#
#daaaah#
#dhhhhh#
.######.`;
const SLOT = `
dddddddd
dffffffh
dffffffh
dffffffh
dffffffh
dffffffh
dffffffh
dhhhhhhh`;
// wooden sign plate: dark outline, light top/left edge, board fill, shade bottom/right. Slice 3.
const SIGN = `
.######.
#llllll#
#lbbbbs#
#lbbbbs#
#lbbbbs#
#lbbbbs#
#ssssss#
.######.`;

// ---------- mono icons ----------
const ICONS = {
  card: `
............
.##########.
.#........#.
.#.##.###.#.
.#.##.....#.
.#....###.#.
.#........#.
.#.######.#.
.#........#.
.##########.
............
............`,
  album: `
............
....###.....
.##########.
.#........#.
.#..####..#.
.#.#....#.#.
.#.#....#.#.
.#..####..#.
.#........#.
.##########.
............
............`,
  map: `
............
....####....
...#....#...
..#..##..#..
..#..##..#..
..#......#..
...#....#...
....#..#....
.....##.....
.....##.....
............
............`,
  folder: `
............
............
.#####......
.#....#.....
.##########.
.#........#.
.#........#.
.#........#.
.#........#.
.##########.
............
............`,
  document: `
............
..######....
..#....##...
..#....#.#..
..#....####.
..#.......#.
..#.####..#.
..#.......#.
..#.####..#.
..#.......#.
..########..
............`,
  mail: `
............
............
.##########.
.#........#.
.##......##.
.#.#....#.#.
.#..#..#..#.
.#...##...#.
.#........#.
.##########.
............
............`,
  'sound-on': `
............
.....#......
....##..#...
.#####...#..
.#...#.#..#.
.#...#.#..#.
.#...#.#..#.
.#...#.#..#.
.#####...#..
....##..#...
.....#......
............`,
  'sound-off': `
............
.....#......
....##......
.#####..#.#.
.#...#...#..
.#...#..#.#.
.#...#......
.#...#......
.#####......
....##......
.....#......
............`,
  code: `
............
............
.......#....
...#..#.#...
..#...#..#..
.#...#....#.
..#..#...#..
...##...#...
....#.......
............
............
............`,
  briefcase: `
............
............
....####....
....#..#....
.##########.
.#........#.
.#..####..#.
.#........#.
.#........#.
.##########.
............
............`,
  download: `
............
.....##.....
.....##.....
.....##.....
.....##.....
..#..##..#..
...#.##.#...
....####....
.....##.....
.##########.
.##########.
............`,
  play: `
............
...#........
...##.......
...###......
...####.....
...#####....
...######...
...#####....
...####.....
...###......
...##.......
...#........`,
  flip: `
............
............
..#......#..
.##########.
..#......#..
............
............
..#......#..
.##########.
..#......#..
............
............`,
  external: `
..######
......##
.....#.#
....#..#
...#....
..#.....
.#......
#.......`,
  pin: `
..###..
.#####.
##...##
##...##
.#####.
.#####.
..###..
...#...
...#...`,
  arrow: `
#######
.#####.
..###..
...#...`,
  close: `
##....##
.##..##.
..####..
...##...
...##...
..####..
.##..##.
##....##`,
  'chevron-left': `
....##
...##.
..##..
.##...
##....
##....
.##...
..##..
...##.
....##`,
  'chevron-right': `
##....
.##...
..##..
...##.
....##
....##
...##.
..##..
.##...
##....`,
  cursor: `
#...
##..
###.
####
###.
##..
#...`,
  'badge-shield': `
............
.##########.
.#........#.
.#..####..#.
.#..####..#.
.#........#.
.#........#.
..#......#..
...#....#...
....#..#....
.....##.....
............`,
  'badge-star': `
............
.....##.....
.....##.....
....####....
.##########.
..########..
...######...
...######...
..###..###..
.##......##.
............
............`,
  'badge-book': `
............
.####..####.
#....##....#
#....##....#
#....##....#
#....##....#
#....##....#
#....##....#
.####..####.
............
............
............`,
  'badge-trophy': `
............
.##########.
.#........#.
.#........#.
..#......#..
...#....#...
....####....
.....##.....
.....##.....
...######...
............
............`,
};

// ---------- multi-colour sprites (classes -> CSS variables) ----------
const SUN = `
....yyyy....
..yyyyyyyy..
.yyyyyyyyyy.
.yyyyyyyyyy.
yyyyyyyyyyyy
yyyyyyyyyyyy
yyyyyyyyyyyy
yyyyyyyyyyyy
.yyyyyyyyyy.
.oyyyyyyyyo.
..oooooooo..
....oooo....`;
const MOON = `
....mmmm....
..mmmmmmmm..
.mmmmmcmmmm.
.mmmmmmmmmm.
mmcmmmmmmmmm
mmmmmmmmccmm
mmmmmmmmccmm
mmmmcmmmmmmm
.mmmmmmmmmm.
.mmmmmmcmmm.
..mmmmmmmm..
....mmmm....`;
const CLOUD_A = `
.......wwwww........
....wwwwwwwwww......
..wwwwwwwwwwwwww....
.wwwwwwwwwwwwwwwww..
wwwwwwwwwwwwwwwwwww.
wwwwwwwwwwwwwwwwwwww
.wsssssssssssssssss.
...sssssssssssssss..`;
const CLOUD_B = `
....wwww....
..wwwwwwww..
.wwwwwwwwww.
wwwwwwwwwwww
.ssssssssss.`;
const TREE = `
.....ooo.....
...ooooooo...
..oo++ooooo..
.oo++oooooo#.
.o++oooooo##.
oo+ooooooo##o
o+oooooooo###
oooooooooo###
.ooooooooo##.
.#ooooooo###.
..##ooooo##..
...#######...
.....ttt.....
.....ttt.....
....tttt.....
....tttt.....`;
const BUSH = `
..ooo..
.o+ooo.
o++oooo
ooooo##
.oooo#.
...t...`;
const PUSHPIN = `
..rrrr..
.rrrrrr.
.rrrRrr.
..rRRr..
...gg...
...gg...
...g....
........`;
const GRASS = `
llllllllllllllll
gglgggglgggglggg
gggggggggggggggg
ggggdggggggggggg
gggdgdgggggdgggg
ggggggggggdgdggg
gggggggggggggggg
gdggggggggggggdg
dgdgggggdggggggg
ggggggggdgdggggg
gggggggggggggggg
gggggggggggggggg`;
const WATER_A = `
........
.hh.....
........
.....hh.
........
..hh....
........
......hh`;
const WATER_B = `
........
..hh....
........
......hh
........
.hh.....
........
.....hh.`;

const SPRITE_CLASSES = {
  sun: { y: 'sun', o: 'sun-2' },
  moon: { m: 'moon', c: 'moon-2' },
  cloud: { w: 'cloud', s: 'cloud-2' },
  tree: { o: 'tree', '+': 'tree-hi', '#': 'tree-lo', t: 'trunk' },
  pushpin: { r: 'pin', R: 'pin-2', g: 'pin-3' },
  grass: { l: 'grass-hi', g: 'grass', d: 'grass-lo' },
  mountains: { B: 'mount', F: 'mount-2', S: 'snow' },
};

// ---------- procedural tiles ----------
function mountainsTile(w = 96, h = 32) {
  const rows = blank(w, h);
  const put = (x, y, c) => { if (y >= 0 && y < h) rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1); };
  for (let x = 0; x < w; x++) {
    const t = (2 * Math.PI * x) / w;
    const back = Math.round(16 + 7 * Math.sin(2 * t) + 4 * Math.sin(5 * t + 1) + 2 * Math.sin(11 * t + 2));
    const front = Math.round(9 + 6 * Math.sin(3 * t + 2) + 3 * Math.sin(7 * t) + 1.5 * Math.sin(13 * t + 1));
    for (let y = 0; y < back; y++) put(x, h - 1 - y, y >= back - 2 && back > 21 ? 'S' : 'B');
    for (let y = 0; y < front; y++) put(x, h - 1 - y, 'F');
  }
  return fromRows(rows);
}
function treesTile(w = 96, h = 18) {
  const rows = blank(w, h);
  for (const x of [2, 36, 70]) stamp(rows, TREE, x, h - 16);
  for (const x of [20, 54, 88]) stamp(rows, TREE, x, h - 14); // partly behind, drawn lower
  for (const x of [15, 31, 49, 65, 83, 93]) stamp(rows, BUSH, x, h - 6);
  return fromRows(rows);
}
function cloudsTile(w = 128, h = 20) {
  const rows = blank(w, h);
  stamp(rows, CLOUD_A, 4, 2);
  stamp(rows, CLOUD_B, 44, 10);
  stamp(rows, CLOUD_A, 76, 7);
  stamp(rows, CLOUD_B, 112, 1);
  return fromRows(rows);
}

// ---------- favicon ----------
const FAVICON = `
################
#aaaaaaaaaaaaaa#
#aaaaaaaaaaaaaa#
#aaaaaaaaaaaaaa#
#awwwwwawwwwwaa#
#aaawaaawaaaaaa#
#aaawaaawaaaaaa#
#aaawaaawwwwaaa#
#aaawaaawaaaaaa#
#aaawaaawaaaaaa#
#aaawaaawwwwwaa#
#aaaaaaaaaaaaaa#
#aaaaaaaaaaaaaa#
#aaaaaaaaaaaaaa#
#aaaaaaaaaaaaaa#
################`;
const PORTRAIT = `
................
................
......####......
.....######.....
.....######.....
.....######.....
......####......
.......##.......
....########....
...##########...
..############..
..############..
..############..
..############..
................
................`;
function placeholderPortrait() {
  const body = pathsFill(parse(PORTRAIT), { '#': '#8C96A8' });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect width="16" height="16" fill="#DCE3EE"/>${body}</svg>`;
}
function placeholderPhoto() {
  const body = pathsFill(parse(ICONS.album), { '#': '#8C96A8' });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 80 60" shape-rendering="crispEdges">` +
    `<rect width="80" height="60" fill="#DCE3EE"/>` +
    `<pattern id="d" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#C3CDDD"/></pattern>` +
    `<rect width="80" height="60" fill="url(#d)"/>` +
    `<g transform="translate(34 18)">${body}</g>` +
    `<text x="40" y="44" font-family="DotGothic16, monospace" font-size="6" text-anchor="middle" fill="#5B6678">PHOTO TO COME</text>` +
    `</svg>`;
}

// ---------- build ----------
mkdirSync(join(root, 'assets/img'), { recursive: true });
mkdirSync(join(root, 'assets/css'), { recursive: true });

const SCENE_SCALE = 4;
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" class="sprite" aria-hidden="true" focusable="false">` +
  Object.entries(ICONS).map(([id, g]) => symbol(`i-${id}`, g)).join('') +
  symbolMulti('i-sun', SUN, SPRITE_CLASSES.sun) +
  symbolMulti('i-moon', MOON, SPRITE_CLASSES.moon) +
  symbolMulti('i-cloud', CLOUD_B, SPRITE_CLASSES.cloud) +
  symbolMulti('i-tree', TREE, SPRITE_CLASSES.tree) +
  symbolMulti('i-bush', BUSH, SPRITE_CLASSES.tree) +
  symbolMulti('i-pushpin', PUSHPIN, SPRITE_CLASSES.pushpin) +
  pattern('mountains', mountainsTile(), SPRITE_CLASSES.mountains, SCENE_SCALE) +
  pattern('trees', treesTile(), SPRITE_CLASSES.tree, SCENE_SCALE) +
  pattern('clouds', cloudsTile(), SPRITE_CLASSES.cloud, SCENE_SCALE) +
  pattern('grass', parse(GRASS), SPRITE_CLASSES.grass, SCENE_SCALE) +
  `</svg>`;
writeFileSync(join(root, 'assets/img/sprite.svg'), sprite + '\n');
writeFileSync(join(root, 'assets/img/favicon.svg'), svg(FAVICON, { '#': THEMES.day.ink, a: THEMES.day.colors.blue, w: '#FFFFFF' }) + '\n');
writeFileSync(join(root, 'assets/img/placeholder-photo.svg'), placeholderPhoto() + '\n');
writeFileSync(join(root, 'assets/img/placeholder-portrait.svg'), placeholderPortrait() + '\n');

function frames(t) {
  const out = {
    box: svg(BOX, { '#': t.ink, w: t.paper, s: t.soft }),
    menu: svg(BOX, { '#': t.navyLine, w: t.navy, s: t.navySoft }),
    album: svg(ALBUM, { '#': t.creamInk, c: t.cream }),
    btn: svg(BUTTON, { '#': t.ink, h: t.btnHi, a: t.btn, d: t.btnLo }),
    'btn-down': svg(BUTTON_DOWN, { '#': t.ink, h: t.btnHi, a: t.btn, d: t.btnLo }),
    slot: svg(SLOT, { d: t.slotLo, f: t.slotFill, h: t.slotHi }),
    sign: svg(SIGN, { '#': '#3B2412', l: '#C08A52', b: '#8B5A2B', s: '#5C3A1A' }),
    pushpin: svg(PUSHPIN, { r: '#E0473A', R: '#9E2B22', g: t.soft }),
    'water-a': svg(WATER_A, { h: t.waterHi }),
    'water-b': svg(WATER_B, { h: t.waterHi }),
  };
  for (const [name, hex] of Object.entries(t.colors)) {
    out[`btn-${name}`] = svg(BUTTON, { '#': t.ink, h: shade(hex, 1.35), a: hex, d: shade(hex, 0.62) });
    out[`btn-${name}-down`] = svg(BUTTON_DOWN, { '#': t.ink, h: shade(hex, 1.35), a: hex, d: shade(hex, 0.62) });
  }
  return out;
}
const vars = (f) => Object.entries(f).map(([k, v]) => `  --frame-${k}: ${dataUri(v)};`).join('\n');
const day = frames(THEMES.day);
const night = frames(THEMES.night);
const classCss = [
  ['cur', 'currentColor'], ['sun', 'var(--sun)'], ['sun-2', 'var(--sun-2)'], ['moon', 'var(--moon)'], ['moon-2', 'var(--moon-2)'],
  ['cloud', 'var(--cloud)'], ['cloud-2', 'var(--cloud-2)'], ['tree', 'var(--tree)'], ['tree-hi', 'var(--tree-hi)'], ['tree-lo', 'var(--tree-lo)'],
  ['trunk', 'var(--trunk)'], ['pin', 'var(--pin)'], ['pin-2', 'var(--pin-2)'], ['pin-3', 'var(--pin-3)'], ['grass', 'var(--grass)'],
  ['grass-hi', 'var(--grass-hi)'], ['grass-lo', 'var(--grass-lo)'], ['mount', 'var(--mount)'], ['mount-2', 'var(--mount-2)'], ['snow', 'var(--snow)'],
].map(([c, v]) => `.px-${c} { fill: ${v}; }`).join('\n');
const css = `/* Generated by scripts/gen-art.mjs. Do not edit by hand. */
:root {
${vars(day)}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${vars(night)}
  }
}
:root[data-theme="dark"] {
${vars(night)}
}
.sprite { position: absolute; width: 0; height: 0; overflow: hidden; }
${classCss}
`;
writeFileSync(join(root, 'assets/css/pixel-art.css'), css);
console.log('wrote sprite.svg (%d icons, 6 sprites, 4 patterns), favicon.svg, placeholders, pixel-art.css (%d KB)',
  Object.keys(ICONS).length, Math.round(css.length / 1024));
