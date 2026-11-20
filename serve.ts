// Vice Cover Studio — tiny static server for local try-outs.
// Serves this repository's app/ directory on http://localhost:8080 and opens
// it in the default browser when one is available. No build step, no
// dependencies, Node's standard library only.

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, 'app');
const port = Number(process.env.PORT ?? 8080);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  const raw = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const target = resolve(join(root, normalize(raw).replace(/^(\.\.[/\\])+/, '')));
  if (!target.startsWith(root)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  const file = existsSync(target) && statSync(target).isDirectory() ? join(target, 'index.html') : target;
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`Vice Cover Studio serving app/ at ${url}`);
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${opener} ${url}`, () => {});
});
