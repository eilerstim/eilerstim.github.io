# eilerstim.github.io — site plan

Status: planned, not yet built. This file is the spec for the build and the record of every decision taken.

## 1. Decisions at a glance

| Topic | Decision |
|---|---|
| Purpose | Personal hub first, professional second. Interests and travel lead; the CV is prominent but not the headline. |
| Visual direction | Pixel art in the Pokémon Diamond/Pearl (Nintendo DS era) UI language, kept serious: muted palette, no jokes in the main copy, all art original. |
| Structure | One scrolling page with anchored sections. |
| Sections | Trainer Card (about), Interests (photo album), Places (visited-country map), Projects, CV, Contact. No blog, skills bars or experience timeline in v1. |
| You on the page | Real photo inside a pixel frame. No sprite of you. |
| Interest photos | Natural photos inside pixel album frames with caption plates; click opens a lightbox. |
| Theme | Light "day" and dark "night" palettes, chosen by the browser's `prefers-color-scheme`. No manual toggle in v1. |
| Interaction level | Moderate: typewriter message boxes, a pixel marker that moves along a route as you scroll, opt-in 8-bit sounds, one hidden easter egg. Still an ordinary website. |
| Navigation | Two prototypes shipped behind a hidden switch (top menu in DP pause-menu style, and a Pokétch-style bottom bar). Decide on the live page, then delete the loser. |
| Language | English only. |
| Domain | eilerstim.github.io (GitHub Pages, deploy from `main`). Custom domain later needs only a `CNAME` file. |
| Projects | Curated list in `data/projects.json`. No GitHub API calls. |
| Contact | Email (obfuscated mailto), GitHub, LinkedIn. No form. |
| CV source | Overleaf (Premium) via Git access. A scheduled GitHub Action clones the project, compiles it and commits the PDF. |
| Visited countries | The "been" app has no API or export, so the list lives in `data/visited.json` and is updated by hand. Map is a flat pixel dot-map in Sinnoh town-map style. |
| Analytics | None. No third-party scripts, no cookies, no banner. |
| Tech | Static HTML, CSS and vanilla JS. No framework, no bundler, no build step for the page itself. |

## 2. Tone and intellectual-property rules

- The page borrows the *look* of DS-era game menus: frame proportions, the white message box with a dark double border, the navy menu strip, a watch-like bottom bar, a trainer-card layout, a town-map style map. Every asset is drawn from scratch for this site.
- Never used: the Pokémon name or logo, Poké Ball shapes, creature sprites, in-game fonts, music or sound rips, the Pokétch logo. Section labels use neutral words (Album, Map, Card), never franchise terms.
- Footer carries one line: "Original pixel art inspired by DS-era game interfaces. Not affiliated with Nintendo, Game Freak or The Pokémon Company."
- Serious register: no "a wild Tim appeared" jokes in visible copy. Playfulness lives in the craft (frames, motion, sound) and in the hidden easter egg.

## 3. Visual system

### 3.1 Palette (starting values, tuned during phase 1)

| Token | Day (light) | Night (dark) | Used for |
|---|---|---|---|
| `--bg` | `#D9EEF9` sky, fading to `#BFE0F3` | `#0F1B33` navy with sparse pixel stars | page background |
| `--surface` | `#FFFFFF` | `#1B2742` | message boxes, cards |
| `--surface-2` | `#F3F6FA` | `#223052` | menu strip, bar backgrounds |
| `--border` | `#2F3A4F` | `#AFC0DF` | outer frame line (2px) |
| `--border-soft` | `#8C96A8` | `#5C6E96` | inner frame line (1px) |
| `--text` | `#1E2430` | `#EDF1F8` | body text |
| `--text-muted` | `#5B6678` | `#A9B6CE` | captions, labels |
| `--accent` | `#3D63B8` Diamond blue | `#7EA6FF` | primary buttons, visited countries, active nav |
| `--accent-2` | `#D15A9B` Pearl pink | `#FF8FC8` | hover and focus accents only, used sparingly |
| `--bar` | `#3E8E86` teal frame | `#2E6A64` | bottom bar frame |
| `--bar-screen` | `#CFE7B4` LCD green | `#9CC58B` | bottom bar screen |
| `--land` / `--water` | `#D8C9A0` / `#7FB7E6` | `#3D4A6E` / `#16223F` | map |

Contrast target: 4.5:1 for all text in both themes, checked in phase 1.

### 3.2 Typography

- Headings, labels, captions, dialog text: **DotGothic16** (Google Fonts, SIL Open Font License), self-hosted as a Latin-subset woff2. It reads like a DS bitmap font and stays legible at 16 to 18 px.
- Paragraphs longer than two lines (bio, project blurbs): system sans stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`). Readability wins over theme for long text.
- Pixel art renders with `image-rendering: pixelated`; photos render normally.

### 3.3 Components (all original art, SVG where possible)

| Component | Description |
|---|---|
| Message box | White panel, 2px dark border plus 1px inner light line, pixel-rounded corners via a 9-slice `border-image`. Typewriter text with a blinking advance arrow; click to skip. |
| Menu strip | Navy strip with white DotGothic16 labels, active item marked by a pixel cursor. Basis of the top-navigation prototype. |
| Trainer Card | 3:2 card with an accent header strip. Left: your photo in a pixel frame. Right: label/value rows with dotted leaders: NAME, LOCATION, ROLE, ADVENTURE STARTED, LANGUAGES. Bottom: 8 badge slots, filled slots show 16×16 pixel badges for degrees or certifications with a tooltip. Slight 3D tilt on hover (off under reduced motion). |
| Bottom bar | Fixed bar in a teal watch-style frame with an LCD-green screen. Six pixel icons (card, album, map, folder, document, mail) plus a sound toggle. Active icon inverted. Basis of the bottom-navigation prototype. |
| Album frame | Cream matte with 2px border and corner tabs; caption plate underneath in DotGothic16. Photo stays natural. |
| Buttons | Raised pixel buttons; primary in `--accent`; press moves them 1px down with an optional blip. |
| Route and marker | A dotted pixel route with one square node per section. A small original pixel pin advances with scroll progress and nodes light up when reached. In the top-menu prototype the route runs under the menu; in the bottom-bar prototype it rides along the bar's top edge. |
| Map | Dot-matrix world map (one pixel square per land cell), visited countries in `--accent`, hover or tap names the country. |
| Lightbox | Native `<dialog>`, pixel frame, ESC and backdrop click close it. |

### 3.4 Motion and sound

- Typewriter at about 40 characters per second; instant under `prefers-reduced-motion`.
- Marker movement, card tilt and section reveals are CSS transforms only; all disabled under reduced motion.
- Three short original 8-bit sounds (select, confirm, back) generated by a script in `scripts/`, played through WebAudio. Off by default; the toggle in the bar or menu turns them on, and the choice is stored in `localStorage`.
- Easter egg: the Konami code switches the Trainer Card to its "black card" tier for the session and opens one hidden message box. Nothing else references it.

## 4. Page structure

Order reflects "personal first".

1. **Header / navigation**: one of the two prototypes (section 5).
2. **Hero: Trainer Card**: the card from 3.3, a typewriter greeting in a message box, two buttons: "Explore" (scrolls to Interests, primary) and "Download CV" (secondary, links straight to the PDF).
3. **Interests ("Album")**: 3 to 6 interests. Each has a title, a one- or two-sentence blurb, and 1 to 3 photos of you doing it in album frames. Responsive grid: 1 column on phones, 2 on tablets, 3 on desktop.
4. **Places ("Map")**: the pixel world map, then a stats row in the same terms as the been app (countries visited, share of the world, per-continent counts) and a per-continent list of country names.
5. **Projects**: cards from `data/projects.json`: name, one-liner, tags, link, optional 16:9 screenshot in a pixel frame, year.
6. **CV**: a message box with "Last updated: {date}" (read from `cv/meta.json`), file size, and a primary "Download PDF" button. A second button appears if a second-language CV exists.
7. **Contact**: three pixel buttons: Email, GitHub, LinkedIn. The email address is assembled in JS from two parts to keep it off scrapers.
8. **Footer**: name, year, the IP disclaimer line, a link to the repository.

## 5. Navigation prototypes and how to decide

- `<html data-nav="auto|top|bottom">`. `auto` means top menu on screens 900px and wider, bottom bar below that. Default is `auto`.
- Hidden switch: `?nav=top`, `?nav=bottom` or `?nav=auto` in the URL, or pressing `Shift+N` three times. The choice persists in `localStorage`.
- Judge on: reach on a phone, clarity for a first-time visitor, whether it fights with photos, how it looks in both themes.
- After the decision the losing prototype's CSS and JS are deleted so the repo stays small.

## 6. Content model

```
data/site.json        name, tagline, location, role, adventureStarted, languages[],
                      badges[] {label, year, icon}, bio, greeting, emailParts[2],
                      github, linkedin, cv {file, languages[]}
data/interests.json   [{id, title, blurb, photos: [{src, alt, caption}]}]
data/projects.json    [{name, blurb, tags[], url, repo, year, image}]
data/visited.json     {denominator, updated, countries: ["CH", "DE", ...]}  (ISO 3166-1 alpha-2)
cv/Tim-Eilers-CV.pdf  built by the Action; stable file name so links never break
cv/meta.json          {updated, sourceCommit, bytes}   written by the Action
cv/.built-from        Overleaf commit SHA of the last successful build
```

Photos: originals are not committed. `scripts/photos.sh` converts them to WebP, longest edge 1600px, under 300 KB each, into `assets/photos/`. Every photo needs alt text; you supply it or approve my draft.

## 7. Tech stack and repository layout

```
index.html
assets/css/   tokens.css  base.css  components.css  sections.css  nav-top.css  nav-bottom.css
assets/js/    main.js  theme.js  nav.js  typewriter.js  route.js  lightbox.js  sound.js  map.js  data.js
assets/fonts/ DotGothic16-latin.woff2
assets/img/   frames and icons as SVG, badges, marker, world-dots.svg, favicon.svg, og.png
assets/sfx/   select.ogg  confirm.ogg  back.ogg
assets/photos/
data/
cv/
scripts/      build-map.mjs  been-to-iso.mjs  photos.sh  sfx-gen.mjs  og-image.mjs
.github/workflows/cv.yml   (CV pipeline)
.github/workflows/check.yml (HTML validation and link check on pull requests, optional)
.nojekyll  robots.txt  README.md  PLAN.md
```

- GitHub Pages serves `main` from the repository root. No page build step: the hero content is hard-coded in `index.html` for a meaningful first paint, the rest renders from the JSON files.
- Native ES modules, no dependencies at runtime, one self-hosted font.
- Scripts in `scripts/` run locally or in Actions with Node 20; they are tooling, not part of the page.

## 8. CV pipeline (Overleaf to the site)

Overleaf Git access is available because the project owner has Premium. The Overleaf docs confirm: clone URL `https://git.overleaf.com/<project-id>`, project ID taken from the project URL, username `git` with a personal Git authentication token as the password (the old email/password login no longer works), one token works for all your projects, and the Overleaf repo has no branches (single `main`).

Workflow `.github/workflows/cv.yml`:

1. Triggers: daily at 03:17 UTC and on manual `workflow_dispatch`.
2. Checks out the site repo, then clones the Overleaf project with the token.
3. Reads the Overleaf HEAD commit; if it equals `cv/.built-from`, stops. Nothing is committed on an unchanged CV.
4. Compiles with `xu-cheng/latex-action@v3` using the engine set in the workflow (`pdflatex`, `xelatex` or `lualatex`, matching the project's compiler setting in Overleaf) and the main file name.
5. Copies the output to `cv/Tim-Eilers-CV.pdf`, writes `cv/meta.json` and `cv/.built-from`, commits and pushes to `main`. GitHub Pages redeploys on that push.
6. On a compile failure the job fails, GitHub notifies you by email, and the previous PDF stays live.

Secrets (Settings > Secrets and variables > Actions): `OVERLEAF_GIT_TOKEN` and `OVERLEAF_PROJECT_ID`. The token is created in Overleaf under Account Settings > Git Integration; it grants access to all your projects, so it is only ever stored as a repository secret and the workflow only ever clones, never pushes to Overleaf. Overleaf may expire tokens after a year; a failing clone step is the signal to rotate it.

A second-language CV is a second Overleaf project handled by a matrix in the same workflow.

## 9. Visited-country workflow

- Initial list: copy the country names from the been app (one per line) into `scripts/been-to-iso.mjs`; it outputs ISO codes into `data/visited.json` and flags names it cannot match.
- After a trip: add one code to the array by hand.
- Map generation: `scripts/build-map.mjs` rasterises Natural Earth 1:110m country polygons (public domain) into a grid of roughly 200 by 100 cells and writes `assets/img/world-dots.svg` with a `data-iso` attribute per land cell. Committed once; rerun only to change resolution.
- Stats: the "share of the world" uses the `denominator` in `visited.json`. Default 195 (UN members plus the two observer states); set it to whatever number been uses so the two match.
- Continent grouping comes from a bundled ISO-to-continent table in `scripts/`.

## 10. Accessibility, performance, privacy, discoverability

- Semantic sections with headings, skip link, visible pixel focus rings, full keyboard support including the lightbox and nav.
- Both themes meet 4.5:1 text contrast; motion and sound are opt-in or respect system preferences.
- Photos lazy-load with explicit dimensions; target page weight under 1.5 MB with photos; Lighthouse 95 or better in all four categories.
- No analytics, no third-party requests, no cookies; `localStorage` only for sound, nav and easter-egg state.
- Meta: title, description, canonical URL, Open Graph and Twitter card with a 1200×630 `og.png` rendered from the Trainer Card by `scripts/og-image.mjs`, JSON-LD `Person`, pixel "TE" favicon.

## 11. Build phases

| Phase | Deliverable | Needs from you |
|---|---|---|
| 1. Foundation | Tokens, fonts, frames, both themes, both nav prototypes, Trainer Card with placeholder content | Nothing |
| 2. Sections | All six sections rendering from placeholder JSON | Decide on navigation |
| 3. Interactions | Typewriter, route marker, lightbox, sound opt-in, easter egg | Nothing |
| 4. CV pipeline | Workflow live, first PDF committed | Secrets, main file name, engine |
| 5. Map | Generator, visited list, stats | Country list from been |
| 6. Content | Real photos, copy, projects, badges, OG image | Everything in section 12 |
| 7. QA and launch | Cross-browser and mobile check, Lighthouse, Pages enabled on `main` | Enable Pages |

Each phase is one pull request from the working branch into `main`.

## 12. Content needed from you

1. Display name, one-line tagline, location, role or title, the year your "adventure started" (career or studies), languages you speak.
2. Up to 8 badges: degrees or certifications with year.
3. A two- or three-sentence bio, or bullet points for me to draft from.
4. Interests: 3 to 6, each with 1 to 3 photos of you doing it and a sentence about it.
5. A profile photo for the Trainer Card, face clearly visible, roughly square.
6. Projects: 3 to 6 with name, one-liner, link, tags, optional screenshot.
7. The list of countries from been and the "share of the world" number it shows.
8. The email address to display and your LinkedIn URL. GitHub is assumed to be github.com/eilerstim.
9. Overleaf: add `OVERLEAF_PROJECT_ID` and `OVERLEAF_GIT_TOKEN` as repository secrets (never paste the token in chat), and tell me the main `.tex` file name and the compiler shown in the Overleaf menu. Say whether a second-language CV project exists.
10. Once phase 7 lands: Settings > Pages > Deploy from branch `main`, folder `/ (root)`.

## 13. Deferred ideas (not in v1)

Blog, skills section, experience timeline, German version, custom domain, GoatCounter analytics, spinning pixel globe, full "overworld" navigation, manual day/night toggle.

## 14. Sources consulted

- Overleaf premium features: https://docs.overleaf.com/getting-started/free-and-premium-plans/premium-features
- Overleaf Git integration: https://docs.overleaf.com/integrations-and-add-ons/git-integration-and-github-synchronization/git
- Overleaf Git authentication tokens: https://docs.overleaf.com/integrations-and-add-ons/git-integration-and-github-synchronization/git-integration/git-integration-authentication-tokens
- Overleaf GitHub synchronization limits: https://www.overleaf.com/learn/how-to/GitHub_Synchronization
- been app listing (sharing only, no export or API): https://apps.apple.com/us/app/id680148327
