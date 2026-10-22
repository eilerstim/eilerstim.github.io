# CV

`Tim-Eilers-CV.pdf`, `meta.json` and `.built-from` in this folder are written by the
GitHub Action in `.github/workflows/cv.yml`. It clones the Overleaf project, compiles it
and commits the result when the Overleaf source changed. Do not edit these files by hand.

Secrets used: `OVERLEAF_PROJECT_ID`, `OVERLEAF_GIT_TOKEN` (repository secrets).
Optional repository variables: `CV_MAIN` (main .tex file, auto-detected otherwise) and
`CV_ENGINE` (`pdflatex`, `xelatex` or `lualatex`; auto-detected from `fontspec` usage otherwise).
