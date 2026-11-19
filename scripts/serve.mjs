// Tiny static file server for local testing (no dependencies).
//   node scripts/serve.mjs                 -> http://localhost:8080/
//   node scripts/serve.mjs --base /repo/   -> http://localhost:8080/repo/  (mimics GitHub Pages subpath)
//   PORT=3000 node scripts/serve.mjs

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]+$/, '');
const port = Number(process.env.PORT) || 8080;
const baseArg = process.argv.indexOf('--base');
let base = baseArg > -1 ? process.argv[baseArg + 1] : '/';
if (!base.startsWith('/')) base = `/${base}`;
if (!base.endsWith('/')) base += '/';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};
// Only serve what gets deployed.
const PUBLIC = ['index.html', 'assets', 'data'];

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (!pathname.startsWith(base)) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end(`Not found. This server mimics GitHub Pages: open ${base}\n`);
    return;
  }
  let rel = decodeURIComponent(pathname.slice(base.length)) || 'index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  const file = normalize(join(root, rel));
  const top = rel.split('/')[0];
  try {
    if (!file.startsWith(root + sep) || !PUBLIC.includes(top) || !(await stat(file)).isFile()) throw new Error('nf');
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found\n');
  }
}).listen(port, () => console.log(`Serving on http://localhost:${port}${base}`));
