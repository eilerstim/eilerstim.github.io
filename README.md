# eilerstim.github.io

Personal page of Tim Eilers, in a DS-era pixel style. Static HTML, CSS and vanilla JavaScript, served by GitHub Pages from `main`.

See [PLAN.md](PLAN.md) for the design decisions and the content model.

## Editing content

| What | Where |
|---|---|
| Name, tagline, card fields, bio, badges, contact links, CV file | `data/site.json` |
| Interests and their photos | `data/interests.json`, photos in `assets/photos/` |
| Projects | `data/projects.json` |
| Visited countries | `data/visited.json` (ISO codes), or `node scripts/been-to-iso.mjs names.txt` with country names copied from the been app |
| Section headings, lead texts, footer | `index.html` |

Keys starting with `_` in the JSON files are notes and are ignored by the page.

## Photos

```
scripts/photos.sh ~/Pictures/trip.jpg ~/Pictures/climbing.png   # writes WebP files into assets/photos/
```

## CV

`.github/workflows/cv.yml` clones the Overleaf project nightly (and on demand from the Actions tab), compiles it and commits `cv/Tim-Eilers-CV.pdf` when the source changed. It needs the repository secrets `OVERLEAF_PROJECT_ID` and `OVERLEAF_GIT_TOKEN`. Optional repository variables: `CV_MAIN` and `CV_ENGINE`. Details in `cv/README.md`.

## Art and map

- `node scripts/gen-art.mjs && node scripts/inline-sprite.mjs` regenerates the pixel icons, frames and placeholders from the ASCII grids in `scripts/gen-art.mjs`.
- `node scripts/build-map.mjs` rebuilds the dot-map from Natural Earth data (downloaded on first run).
- `node scripts/og-image.mjs` renders `assets/img/og.png` for link previews (needs Playwright).

## Previewing

Any static server works, for example `npx serve .` or `python3 -m http.server`. Useful URL parameters while developing: `?theme=morning|day|evening|night` (or `light|dark`) forces a time of day, `?nav=top|bottom|auto` picks a navigation prototype (also Shift+N three times on the page). The sun/moon button in the navigation cycles the time of day and remembers the choice.

Font: DotGothic16 by Fontworks, SIL Open Font License (`assets/fonts/OFL.txt`). Map data: Natural Earth (public domain).
