# Vice Cover Studio — GTA 6-style cover art maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/newmrd0003-create/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/newmrd0003-create/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Turn your own photo and a caption into a Vice City poster-style cover, right in
the browser — no upload, no account, no network. Built for the
[Make GTA 6 Cover Art](https://make.fun/c/gta6-cover-art-01) competition on
[make.fun](https://make.fun).

## What it does

- **Your photos, your panels.** Load one or several photos from your machine,
  drop them into a multi-panel poster layout, and crop + position each panel
  by dragging. One photo can fill every panel, or each panel can hold its own.
- **Poster layouts.** Three layouts: *Sunset Strip* (one tall hero panel beside
  two stacked panels), *Four Corners* (2×2 grid) and *Hero Banner* (wide hero
  over a strip).
- **Vice City grades.** Four colour grades — Sunset, Neon, Noir and Palm —
  applied per cover, with a vignette and a grain pass for the printed-poster feel.
- **Bold caption lettering.** A big display title in Bebas Neue plus a script
  subtitle in Lobster, both editable, with outline, shadow and colour controls.
- **Export PNG.** One tap exports 1080×1080, 1080×1350 or 1920×1080 PNG files
  to share.

## Try it

```sh
node serve.ts
```

Then open <http://localhost:8080> in desktop Chrome. Everything runs offline:
every script, font and sample image is a file under `app/`, and your photos
never leave your machine.

## How it works

- `app/index.html` — the editor page.
- `app/style.css` — the editor chrome (dark, neon-accented).
- `app/src/cover.js` — the cover renderer: layouts, grades, lettering, export.
- `app/src/main.js` — the editor wiring: photo loading, drag crop, controls.
- `app/fonts/` — Bebas Neue and Lobster, both SIL Open Font License (see
  `app/fonts/OFL.txt`).
- `app/samples/` — four Vice City scenes generated for this app, free to use
  as starter photos.

## Originality

No Rockstar Games logo, wordmark, artwork, character or font is used anywhere
in this app. The lettering fonts are open-licensed, the sample scenes are
original art made for this project, and every layout and grade is the author's
own design.

## License

MIT — see [LICENSE](LICENSE).
