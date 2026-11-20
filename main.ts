// Vice Cover Studio — round 5 entry program (Node 22, standard library only).
// Hands the static cover-maker app in: copies app/ and screenshots/ from beside
// this file to /output (or $MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with buildDossier from the vendored make.fun library.
// Deterministic by construction: plain recursive copies, no timestamps in the
// output, and the dossier is rebuilt from the copied files every run.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Integrity check: every copied file must match its source byte for byte
// (size + sha256). A mismatch means the copy is corrupt, so fail loudly
// instead of handing in a half-copied app.
function collectFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectFiles(path));
    else if (entry.isFile()) found.push(path);
  }
  return found.sort();
}

function verifyCopy(sourceDir, destDir) {
  for (const source of collectFiles(sourceDir)) {
    const rel = relative(sourceDir, source);
    const dest = join(destDir, rel);
    const sourceBytes = readFileSync(source);
    const destBytes = readFileSync(dest);
    const sourceHash = createHash('sha256').update(sourceBytes).digest('hex');
    const destHash = createHash('sha256').update(destBytes).digest('hex');
    if (sourceBytes.length !== destBytes.length || sourceHash !== destHash) {
      throw new Error(`copy mismatch: ${rel} (source ${sourceBytes.length} bytes sha256 ${sourceHash}, dest ${destBytes.length} bytes sha256 ${destHash})`);
    }
    console.log(`copied ${rel} (${sourceBytes.length} bytes, sha256 ${sourceHash.slice(0, 12)}…)`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}
verifyCopy(join(here, 'app'), join(out, 'app'));
if (existsSync(join(here, 'screenshots'))) verifyCopy(join(here, 'screenshots'), join(out, 'screenshots'));

// The scorer's own caps: only text_max_bytes shapes the bytes; the others refuse
// an entry the scorer would refuse (more than 4 screenshots or one over 256 KiB;
// more than 993 files in app/ or 48 MiB of app files in all, or a path under
// app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
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
