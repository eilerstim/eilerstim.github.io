#!/usr/bin/env node
// Generates every piece of pixel art for the site from ASCII grids.
// Output: assets/img/sprite.svg (icon symbols), assets/img/favicon.svg,
//         assets/img/placeholder-photo.svg, assets/css/pixel-art.css (9-slice frames per theme).
// Run: node scripts/gen-art.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Theme colours used inside baked art (frames). Keep in sync with assets/css/tokens.css.
const THEMES = {
  day: {
    ink: '#2F3A4F', soft: '#8C96A8', paper: '#FFFFFF',
    navy: '#1F2D52', navySoft: '#3A4B7A', navyLine: '#C7D2EA',
    cream: '#F4EBD3', creamInk: '#2F3A4F',
    accent: '#3D63B8', accentHi: '#8FB0F0', accentLo: '#24407F',
    btn: '#F3F6FA', btnHi: '#FFFFFF', btnLo: '#B9C4D6',
    slotFill: '#DCE3EE', slotLo: '#A9B5C8', slotHi: '#FFFFFF',
  },
  night: {
    ink: '#AFC0DF', soft: '#5C6E96', paper: '#1B2742',
    navy: '#0B1428', navySoft: '#263656', navyLine: '#8EA3CF',
    cream: '#CFC6AE', creamInk: '#2F3A4F',
    accent: '#5B86E0', accentHi: '#A9C3FF', accentLo: '#2F4E94',
    btn: '#223052', btnHi: '#3B4F7C', btnLo: '#111A30',
    slotFill: '#1A2540', slotLo: '#0C1428', slotHi: '#3A4D78',
  },
};

// ---------- helpers ----------
function parse(grid) {
  const rows = grid.trim().split('\n').map((r) => r.trim());
  const w = rows[0].length;
  for (const r of rows) if (r.length !== w) throw new Error(`Ragged grid row "${r}" (expected width ${w})`);
  return { rows, w, h: rows.length };
}

// Merge horizontal runs of the same symbol into path commands, one path per symbol.
function paths({ rows, w, h }, colours) {
  const d = {};
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const c = rows[y][x];
      let n = 1;
      while (x + n < w && rows[y][x + n] === c) n++;
      if (c !== '.' && colours[c] !== undefined) {
        d[c] = (d[c] || '') + `M${x} ${y}h${n}v1h-${n}z`;
      } else if (c !== '.' && colours[c] === undefined) {
        throw new Error(`No colour for symbol "${c}"`);
      }
      x += n;
    }
  }
  return Object.entries(d).map(([c, dd]) => `<path fill="${colours[c]}" d="${dd}"/>`).join('');
}

function svg(grid, colours, attrs = '') {
  const g = parse(grid);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${g.w}" height="${g.h}" viewBox="0 0 ${g.w} ${g.h}" shape-rendering="crispEdges"${attrs}>${paths(g, colours)}</svg>`;
}

function symbol(id, grid) {
  const g = parse(grid);
  return `<symbol id="${id}" viewBox="0 0 ${g.w} ${g.h}">${paths(g, { '#': 'currentColor' })}</symbol>`;
}

function dataUri(s) {
  return `url("data:image/svg+xml,${s.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
}

// ---------- frames (9-slice) ----------
// Message box: dark outline, white gap, soft inner line. Slice 4.
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

// Album frame: outer line, cream matte with corner tabs, inner line, transparent centre. Slice 5.
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

// Raised button: outline, highlight top/left, shade bottom/right. Slice 3.
const BUTTON = `
.######.
#hhhhhh#
#haaaad#
#haaaad#
#haaaad#
#haaaad#
#hddddd#
.######.`;

// Pressed button: shade top/left, highlight bottom/right.
const BUTTON_DOWN = `
.######.
#dddddd#
#daaaah#
#daaaah#
#daaaah#
#daaaah#
#dhhhhh#
.######.`;

// Sunken slot (badge holders): shade top/left, highlight bottom/right, no outline.
const SLOT = `
dddddddd
dffffffh
dffffffh
dffffffh
dffffffh
dffffffh
dffffffh
dhhhhhhh`;

// ---------- icons (12x12 unless noted) ----------
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

// ---------- favicon (16x16, letters T and E on accent) ----------
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

// Placeholder portrait: square, a pixel silhouette on a dotted field.
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
  const body = paths(parse(PORTRAIT), { '#': '#8C96A8' });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 16 16" shape-rendering="crispEdges">` +
    `<rect width="16" height="16" fill="#DCE3EE"/>${body}</svg>`;
}

// Placeholder "photo": 4:3, a camera glyph on a dotted field.
function placeholderPhoto() {
  const cam = parse(ICONS.album);
  const body = paths(cam, { '#': '#8C96A8' });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 80 60" shape-rendering="crispEdges">` +
    `<rect width="80" height="60" fill="#DCE3EE"/>` +
    `<pattern id="d" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#C3CDDD"/></pattern>` +
    `<rect width="80" height="60" fill="url(#d)"/>` +
    `<g transform="translate(34 18) scale(1)">${body}</g>` +
    `<text x="40" y="44" font-family="DotGothic16, monospace" font-size="6" text-anchor="middle" fill="#5B6678">PHOTO TO COME</text>` +
    `</svg>`;
}

// ---------- build ----------
mkdirSync(join(root, 'assets/img'), { recursive: true });
mkdirSync(join(root, 'assets/css'), { recursive: true });

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">` +
  Object.entries(ICONS).map(([id, g]) => symbol(`i-${id}`, g)).join('') + `</svg>`;
writeFileSync(join(root, 'assets/img/sprite.svg'), sprite + '\n');

writeFileSync(join(root, 'assets/img/favicon.svg'),
  svg(FAVICON, { '#': THEMES.day.ink, a: THEMES.day.accent, w: '#FFFFFF' }) + '\n');
writeFileSync(join(root, 'assets/img/placeholder-photo.svg'), placeholderPhoto() + '\n');
writeFileSync(join(root, 'assets/img/placeholder-portrait.svg'), placeholderPortrait() + '\n');

function frames(t) {
  return {
    box: svg(BOX, { '#': t.ink, w: t.paper, s: t.soft }),
    menu: svg(BOX, { '#': t.navyLine, w: t.navy, s: t.navySoft }),
    album: svg(ALBUM, { '#': t.creamInk, c: t.cream }),
    btn: svg(BUTTON, { '#': t.ink, h: t.btnHi, a: t.btn, d: t.btnLo }),
    btnDown: svg(BUTTON_DOWN, { '#': t.ink, h: t.btnHi, a: t.btn, d: t.btnLo }),
    btnPrimary: svg(BUTTON, { '#': t.ink, h: t.accentHi, a: t.accent, d: t.accentLo }),
    btnPrimaryDown: svg(BUTTON_DOWN, { '#': t.ink, h: t.accentHi, a: t.accent, d: t.accentLo }),
    slot: svg(SLOT, { d: t.slotLo, f: t.slotFill, h: t.slotHi }),
  };
}
function vars(f) {
  return [
    `  --frame-box: ${dataUri(f.box)};`,
    `  --frame-menu: ${dataUri(f.menu)};`,
    `  --frame-album: ${dataUri(f.album)};`,
    `  --frame-btn: ${dataUri(f.btn)};`,
    `  --frame-btn-down: ${dataUri(f.btnDown)};`,
    `  --frame-btn-primary: ${dataUri(f.btnPrimary)};`,
    `  --frame-btn-primary-down: ${dataUri(f.btnPrimaryDown)};`,
    `  --frame-slot: ${dataUri(f.slot)};`,
  ].join('\n');
}
const day = frames(THEMES.day);
const night = frames(THEMES.night);
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
`;
writeFileSync(join(root, 'assets/css/pixel-art.css'), css);

console.log('wrote sprite.svg (%d icons), favicon.svg, placeholder-photo.svg, pixel-art.css (%d bytes)',
  Object.keys(ICONS).length, css.length);
