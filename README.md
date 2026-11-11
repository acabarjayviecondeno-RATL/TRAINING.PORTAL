# Training Portal

## Vite + tests (new)
```
npm install
npm run dev        # vite dev server
npm run build      # multi-page build -> dist/
npm run test:unit  # role guard + syntax (no extra install)
```
E2E tests only: `npm i -D playwright && npx playwright install chromium`, then `npm run test:e2e`.
Keep the project OUTSIDE OneDrive (e.g. `C:\dev\training-portal`); OneDrive sync breaks `node_modules`.

| Path | Purpose |
|---|---|
| `src/config.js` | Apps Script Web App URL (main portal) |
| `src/styles/tokens.css` | `--pt-*` design tokens (do not override the pages' own variables) |
| `src/session.js` | token, `logout()`, auto-logout on `{code:"session"}` (exposed as `window.PortalSession`) |
| `src/api/leaves.js` | Leave / Absent API (same requests as before + token), `window.PortalApi.leaves` |
| `backend/apps-script-role-guard.gs` | paste into the same Apps Script project; see its header for the soft -> enforced rollout |
| `docs/ROLE_MENUS.md` | per-role menu checklist |
| `tests/` | `unit/` (node:test) and `e2e/` (Playwright, backend mocked) |


Static HTML pages (GitHub Pages) + Google Apps Script web app + Cloudflare Worker (Telegram approvals).

## Files
| File | Purpose |
|---|---|
| `index.html` | Login (password + email OTP) |
| `ST*.html` | Specialized Trainer dashboards (same code; `KPI_PAGE_GROUP` differs: CD / SES / SPLUS) |
| `RTO.html`, `SEPCO.html` | Approver dashboards |
| `Admin.html` | Admin tools |
| `SFT.html` + `backend/SFT_appscript.txt` | SFT portal, separate Apps Script / spreadsheet |
| `backend/app_sript.txt` | Main Apps Script backend (paste into Apps Script editor) |
| `backend/worker.txt` | Cloudflare Worker for Telegram approve/reject |
| `FT.html` | iframe embed of the portal |
| `docs/KPI_Process_and_Computation.md` | KPI formulas and weights |

## Deploy
1. Apps Script: paste file, Deploy > New deployment > Web app (Execute as: Me). Copy the `/exec` URL.
2. Replace `WEB_APP_URL` in the HTML pages (it appears in every page; SFT has its own URL).
3. Script Properties (never in code): `TG_BOT_TOKEN`, `TG_SECRET`, `TG_WEBHOOK_SECRET`, `TG_WEBAPP_URL`, `GEMINI_API_KEY`.
4. Worker env: `TG_BOT_TOKEN`, `TG_WEBAPP_URL`, `TG_SECRET`, `WEBHOOK_SECRET`.
   Crons: `0 3 * * *` and `0 11 * * *` (UTC).

## Security notes
- Never paste real API keys in source files. Use Script Properties.
- `backend/` is in `.gitignore` (paste its files into Apps Script / Cloudflare manually).
- HTML pages stay in the project root because they link to each other by file name (e.g. `index.html`).
