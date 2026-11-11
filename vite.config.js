import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Multi-page app: every HTML page stays at the project root (they link to each other by file name,
// e.g. location.replace('index.html')), so each one is its own Rollup input.
const pages = ['index', 'ST', 'ST_Content_Developer', 'ST_SES_NSO_CX', 'ST_SPlus_Expert_Admin', 'RTO', 'SEPCO', 'Admin'];

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(import.meta.dirname, `${p}.html`)])),
    },
  },
});
