// Vice City Sunset — gta6-cover-art-01 entry program (Node 22, stdlib only).
// It hands the app in: copies this repo's app/ and screenshots/ into the
// output directory and writes /output/dossier.json with the vendored
// make.fun library, so the scorer can rebuild the same dossier byte for
// byte. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program is deterministic: the same repo writes the same bytes on
// every run, well inside the 10-second limit.

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

if (!existsSync(appDir) || !statSync(appDir).isDirectory()) {
  throw new Error('app/: no such directory — the entry is the static app under app/');
}
if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
  throw new Error('screenshots/: no such directory — the entry needs 3 or 4 screenshots');
}

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the other caps refuse an entry the scorer would refuse — more
// than 4 screenshots or one over 256 KiB, more than 993 files in app/ or
// 48 MiB of app files in all, or a path under app/ over 1000 bytes. app/
// counts beside /output's own 1000-entry cap, its screenshots/ and
// dossier.json, so 993 app entries plus those make exactly 1000.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(`wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
