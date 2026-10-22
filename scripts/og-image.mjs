#!/usr/bin/env node
// Renders assets/img/og.png (1200x630) from the live hero for link previews.
// Run: node scripts/og-image.mjs   (needs Playwright; uses the global install when present)
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = join(root, p);
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/?theme=light&nav=top`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await page.goto(url, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: `
  .nav-top, .nav-bottom, .skip-link, .bio, .hero__actions, .footer, main > .section:not(#about) { display: none !important; }
  body { background-attachment: scroll; }
  .section--hero { padding: 0; min-height: 630px; display: grid; align-items: center; }
  .hero { grid-template-columns: 440px 1fr; gap: 48px; align-items: center; }
  .container { max-width: 1120px; }
` });
await page.waitForTimeout(400);
await page.screenshot({ path: join(root, 'assets/img/og.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
server.close();
console.log('wrote assets/img/og.png');
