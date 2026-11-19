// Vice City Sunset — the entry program for gta6-cover-art-01 (Node 22, stdlib only).
//
// It hands the app in: everything under this repo's app/ plus screenshots/
// is copied to the output directory, and /output/dossier.json is written
// with buildDossier from the vendored make.fun library, which is the
// summary the judge reads. Run locally with MAKEFUN_OUTPUT_DIR set:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// In the grader the output directory is /output. The program must be
// deterministic: two runs over the same tree write identical bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps mirror the gate so a tree the scorer would refuse is refused here
// first: at most 4 screenshots of 256 KiB, at most 993 app files totalling
// 48 MiB, and no app path longer than 1000 bytes. text_max_bytes is the
// only cap that shapes the dossier's bytes.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
