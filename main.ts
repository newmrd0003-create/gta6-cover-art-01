// Vice Cover Studio — round 7 entrypoint (Node 22, standard library only).
// Hands the app in: copies this repository's app/ and screenshots/ beside this
// file into the output directory and writes /output/dossier.json with the
// vendored make.fun library, exactly as the kit's starter does. Outside the
// grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's caps, as the kit's starter passes them: only text_max_bytes
// shapes the dossier's bytes; the rest make this program refuse exactly where
// the scorer would (more than 4 screenshots or one over 256 KiB; app/ past
// 993 entries or 48 MiB, or a path over 1000 bytes). The build is
// deterministic: the same tree always writes the same dossier bytes, so the
// grader's two runs agree.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
