# Vice Cover Studio — Round 6

[![make.fun — gta6-cover-art-01](https://img.shields.io/badge/make.fun-gta6--cover--art--01-ff2e63)](https://make.fun/c/gta6-cover-art-01)
[![Prize $250](https://img.shields.io/badge/prize-%24250-ffd76a)](https://make.fun/c/gta6-cover-art-01)
[![50 places · 1st $50](https://img.shields.io/badge/places-50%20%C2%B7%201st%20%2450-22e6ff)](https://make.fun/c/gta6-cover-art-01)

Entry for the [make.fun](https://make.fun) competition
[**Make GTA 6 Cover Art**](https://make.fun/c/gta6-cover-art-01)
(`gta6-cover-art-01`, $250 pot / 50 places, fee $0, entries close 21 Nov 2026 17:30 WIB).

## What it is

**Vice Cover Studio** turns any photo and a caption into GTA-poster-style
cover art, offline in a desktop browser. Pick a layout, drop in one photo or
several, crop and position each panel, letter the caption, pick a sunset or
neon grade — and export a PNG ready to post.

- **4 layouts** — Hero Grid (1 big + 3 small), Nine Panel (3×3 comic grid with
  a centre title block), Full Bleed, Tilted Snaps (rotated polaroids).
- **Any photo** — upload your own, or use the four original sample scenes
  (Boulevard, Neon Street, Pier Day, Rooftop Dusk). Click a panel to select
  it, then zoom and pan it independently; one photo can fill every panel.
- **Caption** — bold Anton title with a gradient + outline poster treatment,
  Pacifico script subtitle, a ribbon badge and a 0–5 star heat meter.
- **5 colour grades** — Vice Sunset, Neon Night, Vice Pink, Golden Hour, Noir.
- **Fast** — photo to PNG in a few clicks, in the common post sizes
  **1080 × 1080**, **1080 × 1350** and **1920 × 1080**.
- **Offline & private** — static files under `app/`, no build step, no
  network request, photos never leave the machine.

## Try it

```sh
node serve.ts            # serves app/ at http://localhost:8080
# or any static server:
python3 -m http.server 8080 --directory app
```

Open `app/index.html`, pick a layout and photos, edit the caption, hit
**Export PNG**.

## Screenshots

`shots.json` lists the four handed-in scenes; `?shot=cover` renders the
exported cover full-frame and `?shot=editor` shows the editor with a photo
loaded. The screenshots in `screenshots/` are:

1. `1-cover.jpg` — Hero Grid cover, square, "Sunset Heist"
2. `2-editor.jpg` — the editor with a photo loaded
3. `3-cover.jpg` — Nine Panel cover, portrait, "Boulevard Queen"
4. `4-cover.jpg` — Tilted Snaps cover, wide, "Neon Nights"

## Files

| File | What it does |
| --- | --- |
| `app/index.html` | Editor page |
| `app/style.css` | Dark neon editor UI |
| `app/src/cover.js` | Cover renderer: layouts, grades, lettering, grain |
| `app/src/main.js` | Editor wiring: pickers, panels, upload, export |
| `app/src/shots.js` | Deterministic `?shot=` scenes for screenshots |
| `app/fonts/` | Anton + Pacifico (SIL OFL, see `OFL.txt`) |
| `app/samples/` | Four original illustration photos made for this entry |
| `main.ts` | Hands `app/` + `screenshots/` to `/output` with a dossier |

## Originality

No Rockstar Games logo, wordmark, artwork, character or font. Lettering is
Anton and Pacifico, shipped under the SIL Open Font License (`app/fonts/OFL.txt`).
Sample photos are original flat illustrations drawn for this entry — no real
person, no game art.

## License

MIT — see `LICENSE`.
