import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Multi-page app: every HTML page stays at the project root (they link to each other by file name,
// e.g. location.replace('index.html')), so each one is its own Rollup input.
const pages = ['index', 'ST', 'FT', 'SFT', 'ST_Content_Developer', 'ST_SES_NSO_CX', 'ST_SPlus_Expert_Admin', 'RTO', 'SEPCO', 'Admin'];

export default defineConfig({
  // Dapat tugma sa pangalan ng GitHub repo (case-sensitive)
  base: '/TRAINING.PORTAL/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(__dirname, `${p}.html`)])),
    },
  },
});