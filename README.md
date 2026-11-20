# Vice Cover Studio — GTA 6 Cover Art Maker

[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![make.fun rank](https://make.fun/badge/gta6-cover-art-01/newmrd0003-create/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![make.fun reward](https://make.fun/badge/gta6-cover-art-01/newmrd0003-create/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Cover Studio** turns your own photos into GTA-style cover art: a multi-panel
poster with bold caption lettering and a Vice City sunset or neon grade, exported
as a PNG to share. Built for the [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01)
competition on [make.fun](https://make.fun).

## What it does

- **Any photo** — add photos from your machine (they never leave it), or load the two bundled sample photos.
- **Crop & position each photo** — click a panel, then zoom and pan that photo until the crop is right.
- **Several panels, one photo or several** — Hero, Duo, Trio and Quad layouts; each panel takes its own photo.
- **Edit the caption** — a script line, a big block title and a tagline, all live in the preview.
- **Sunset / neon grade** — Sunset, Neon Nights, Dusk and Noir colour grades over the whole poster.
- **Fast & easy** — photo to PNG in four steps, exported at 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only — `app/index.html` opens in desktop Chrome and works with no
network request. Every script, image and font is a file under `app/`.

## How it is built

- `app/index.html` — the editor page.
- `app/src/main.js` — editor state, controls, live preview and PNG export.
- `app/src/cover.js` — the cover renderer: panels, crop/position, grade, lettering.
- `app/src/shots.js` — screenshot presets (`?shot=coverWide|coverPortrait|coverSquare|editor`).
- `app/style.css` — the editor theme.
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License 1.1 (`OFL.txt`).
- `app/samples/` — two sample photos made with an image model, free to use.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.

## Originality

Original design. No Rockstar Games logo, wordmark, artwork or font. Display type is
Anton and Pacifico (SIL OFL 1.1). Sample photos were made with an image model.

## License

MIT — see [LICENSE](LICENSE).
