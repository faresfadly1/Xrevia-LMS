import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dist = resolve(root, 'dist');
const assetsSrc = resolve(dist, 'assets');
const assetsDest = resolve(root, 'assets');

if (!existsSync(assetsSrc)) {
  throw new Error('dist/assets was not found. Run the Vite build first.');
}

rmSync(assetsDest, { recursive: true, force: true });
mkdirSync(assetsDest, { recursive: true });
cpSync(assetsSrc, assetsDest, { recursive: true });

for (const fileName of ['favicon.svg', 'icons.svg']) {
  const src = resolve(dist, fileName);
  if (existsSync(src)) {
    cpSync(src, resolve(root, fileName));
  }
}

console.log('GitHub Pages assets synced to repo root.');
