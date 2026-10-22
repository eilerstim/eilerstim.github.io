#!/usr/bin/env node
// Converts a list of country names (one per line, as shown in the been app) into ISO codes
// and merges them into data/visited.json.
// Run: node scripts/been-to-iso.mjs names.txt   (or pipe names on stdin)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const countries = JSON.parse(readFileSync(join(root, 'data/countries.json'), 'utf8'));
const visitedPath = join(root, 'data/visited.json');
const visited = JSON.parse(readFileSync(visitedPath, 'utf8'));

const ALIASES = {
  usa: 'US', 'united states of america': 'US', 'u.s.a.': 'US', america: 'US',
  uk: 'GB', 'great britain': 'GB', england: 'GB', scotland: 'GB', wales: 'GB', britain: 'GB',
  'czech republic': 'CZ', turkey: 'TR', 'south korea': 'KR', korea: 'KR', 'north korea': 'KP',
  russia: 'RU', 'russian federation': 'RU', vietnam: 'VN', 'viet nam': 'VN', laos: 'LA',
  'vatican': 'VA', 'holy see': 'VA', 'uae': 'AE', emirates: 'AE', macedonia: 'MK',
  'bosnia': 'BA', 'ivory coast': 'CI', "cote d'ivoire": 'CI', 'east timor': 'TL',
  'congo': 'CG', 'democratic republic of the congo': 'CD', 'dr congo': 'CD', 'drc': 'CD',
  'cape verde': 'CV', 'cabo verde': 'CV', swaziland: 'SZ', burma: 'MM', myanmar: 'MM',
  'the bahamas': 'BS', bahamas: 'BS', 'the gambia': 'GM', gambia: 'GM', 'the netherlands': 'NL',
  netherlands: 'NL', holland: 'NL', 'são tomé and príncipe': 'ST', 'sao tome and principe': 'ST',
  'saint lucia': 'LC', 'st lucia': 'LC', 'st kitts and nevis': 'KN', 'st vincent and the grenadines': 'VC',
  'hong kong': 'HK', macau: 'MO', macao: 'MO', taiwan: 'TW', palestine: 'PS', kosovo: 'XK',
  'brunei darussalam': 'BN', 'syrian arab republic': 'SY', 'iran': 'IR', 'tanzania': 'TZ',
  'micronesia': 'FM', 'federated states of micronesia': 'FM', 'eswatini': 'SZ', 'curacao': 'CW',
  'reunion': 'RE', 'réunion': 'RE', 'french guiana': 'GF', 'guadeloupe': 'GP', 'martinique': 'MQ',
  'canary islands': 'ES', 'madeira': 'PT', 'azores': 'PT', 'bali': 'ID', 'sicily': 'IT', 'sardinia': 'IT',
  'crete': 'GR', 'corsica': 'FR', 'tenerife': 'ES', 'mallorca': 'ES', 'majorca': 'ES', 'ibiza': 'ES',
  'zanzibar': 'TZ', 'tibet': 'CN', 'puerto rico': 'PR', 'greenland': 'GL', 'faroe islands': 'FO',
};
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and')
  .replace(/[^a-z0-9' ]+/g, ' ').replace(/\b(the|republic of|kingdom of|state of)\b/g, ' ').replace(/\s+/g, ' ').trim();

const byName = new Map();
for (const [iso, c] of Object.entries(countries)) byName.set(norm(c.name), iso);
for (const [alias, iso] of Object.entries(ALIASES)) byName.set(norm(alias), iso);

const input = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : readFileSync(0, 'utf8');
const found = new Set(visited.countries || []);
const missed = [];
for (const raw of input.split(/\r?\n/)) {
  const line = raw.replace(/^[\s\-•*\d.)]+/, '').replace(/\s*\(.*\)\s*$/, '').trim();
  if (!line) continue;
  if (/^[A-Z]{2}$/.test(line)) { found.add(line); continue; }
  const iso = byName.get(norm(line));
  if (iso) found.add(iso); else missed.push(line);
}
visited.countries = [...found].sort();
visited.updated = new Date().toISOString().slice(0, 10);
delete visited.placeholder;
writeFileSync(visitedPath, JSON.stringify(visited, null, 2) + '\n');
console.log(`${visited.countries.length} countries written to data/visited.json`);
if (missed.length) console.log(`Not matched (add by ISO code by hand): ${missed.join(', ')}`);
