# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/newmrd0003-create/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/newmrd0003-create/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Coast Cover Studio — an offline browser app that turns any photo and caption into GTA 6-style cover art: a multi-panel poster with bold sunset-gradient lettering, a neon script subtitle, and a Vice City neon-sunset grade, exported as a PNG to share. Photos never leave the machine: no upload, no account, no watermark.

What it does:

- **Any photo** — load up to 4 photos into slots; click a panel to pick its photo, drag on the cover to crop, scroll or slide to zoom, reset per slot.
- **Six layouts** — Hero Grid (hero + three), Nine Panel (3×3 with a title block), Full Bleed, Tilted Snaps (polaroid-style), Duo Split, and Story Strip.
- **Five grades** — Vice Sunset, Neon Night, Palm Gold, Hot Pink, and Teal Noir, each a gradient-map wash over the photos, plus film grain and vignette.
- **Lettering** — a big Anton title with a sunset gradient and dark outline, a glowing Pacifico neon subtitle, a badge ribbon, and a five-star heat meter (both fonts vendored under the SIL Open Font License).
- **Fast export** — one click saves all three post sizes as PNG: 1080×1080, 1080×1350, and 1920×1080. Undo/redo included.
- **Fully offline** — static files only, every script, font, and sample under `app/`; nothing loads over the network.

Original art and lettering throughout — no Rockstar Games logo, artwork, or font.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies. `main.ts` (Node 22) hands the app in: it copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` via `vendor/makefun-app.ts`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=hzw5fs6y&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
