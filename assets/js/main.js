import { initTheme } from './theme.js';
import { initNav } from './nav.js';
import { initRoute } from './route.js';
import { initTypewriter } from './typewriter.js';
import { initLightbox } from './lightbox.js';
import { initSound } from './sound.js';
import { initEaster } from './easter.js';
import { loadAll } from './data.js';
import { initScene } from './scene.js';
import { initCard } from './card.js';
import { initReveal } from './reveal.js';

initTheme();
initNav();
initSound();
initLightbox();
initEaster();
initScene();
initCard();
document.querySelectorAll('[data-year]').forEach((n) => { n.textContent = String(new Date().getFullYear()); });

const finish = () => { initTypewriter(); initRoute(); initReveal(); };
loadAll().then(finish).catch((err) => { console.error('content failed to load', err); finish(); });
