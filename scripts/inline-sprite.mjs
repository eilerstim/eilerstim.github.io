#!/usr/bin/env node
// Copies assets/img/sprite.svg into index.html between the sprite markers.
// Run after scripts/gen-art.mjs: node scripts/inline-sprite.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const sprite = readFileSync(join(root, 'assets/img/sprite.svg'), 'utf8').trim();
const out = html.replace(/<!-- sprite:start -->[\s\S]*?<!-- sprite:end -->/, `<!-- sprite:start -->\n${sprite}\n<!-- sprite:end -->`);
if (out === html) throw new Error('sprite markers not found in index.html');
writeFileSync(join(root, 'index.html'), out);
console.log('sprite inlined');
