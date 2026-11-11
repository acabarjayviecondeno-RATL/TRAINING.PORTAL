// Day 5: Playwright (library) + node:test. Pages run for real; only the network outside this project is faked.
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { start } = require('../helpers/server.cjs');
const { setup, ST_LOGIN } = require('../helpers/mock.cjs');

const LEAVES = [
  { id: 'L1', date: '2026-11-03', type: 'Leave', reason: 'Fam', status: 'Approved', approver: 'rto@x.com' },
  { id: 'L2', date: '2026-11-05', type: 'Absent', reason: 'Sick', status: 'Pending', approver: 'rto@x.com' },
];

let srv, browser;
test.before(async () => { srv = await start(); browser = await chromium.launch(); });
test.after(async () => { await browser.close(); srv.server.close(); });

async function openST(opts = {}, login = ST_LOGIN) {
  const context = await browser.newContext();
  if (login) // seed once per tab (an init script runs on every navigation, which would re-create the session after logout)
  if (login) await context.addInitScript((kv) => { if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded', '1'); for (const k in kv) localStorage.setItem(k, kv[k]); }, login);
  const calls = await setup(context, opts);
  const page = await context.newPage();
  const dialogs = [];
  page.on('dialog', async (d) => { dialogs.push(d.message()); await d.accept(); });
  await page.goto(srv.url + '/ST.html');
  return { context, page, calls, dialogs };
}

test('not logged in -> redirected to index.html (existing early guard still works)', async () => {
  const { context, page } = await openST({}, null);
  await page.waitForURL('**/index.html');
  await context.close();
});

test('ST page loads the new modules (session + api)', async () => {
  const { context, page } = await openST();
  await page.waitForFunction(() => window.PortalApi && window.PortalSession);
  assert.equal(await page.evaluate(() => PortalSession.getToken()), 'tok-123');
  await context.close();
});

test('Leave list: api/leaves.js sends getLeaves with user + token, and records reach the page', async () => {
  const { context, page, calls } = await openST({ leaves: LEAVES });
  await page.waitForFunction(() => typeof allLeaveRecords !== 'undefined' && allLeaveRecords.length === 2, null, { timeout: 15000 });
  const c = calls.find((x) => x.action === 'getLeaves');
  assert.equal(c.query.user, 'trainer@x.com');
  assert.equal(c.query.token, 'tok-123');
  assert.deepEqual(await page.evaluate(() => allLeaveRecords.map((r) => r.id)), ['L1', 'L2']);
  await context.close();
});

test('Leave submit: saveLeave body keeps the same fields as before + token', async () => {
  const { context, page, calls } = await openST({ leaves: [] });
  await page.waitForFunction(() => window.PortalApi && typeof handleAddLeaveAbsent === 'function');
  await page.waitForFunction(() => document.querySelectorAll('#leaveApproverSelect option[value="rto@x.com"]').length > 0, null, { timeout: 15000 });
  await page.evaluate(() => {
    document.getElementById('leaveDateInput').value = '2026-11-20';
    document.getElementById('leaveTypeInput').selectedIndex = 0;
    document.getElementById('leaveReasonInput').value = 'Family';
    document.getElementById('leaveApproverSelect').value = 'rto@x.com';
  });
  await page.evaluate(() => handleAddLeaveAbsent());
  await page.waitForFunction(() => allLeaveRecords.some((r) => r.id === 'Lnew'));
  const c = calls.find((x) => x.action === 'saveLeave');
  assert.equal(c.method, 'POST');
  assert.equal(c.body.user, 'trainer@x.com');
  assert.equal(c.body.date, '2026-11-20');
  assert.equal(c.body.remarks, 'Family');
  assert.equal(c.body.approverEmail, 'rto@x.com');
  assert.equal(c.body.token, 'tok-123');
  assert.ok('planTitle' in c.body && 'planOnly' in c.body && 'id' in c.body);
  await context.close();
});

test('Leave delete: deleteLeave body + record removed from the page', async () => {
  const { context, page, calls } = await openST({ leaves: LEAVES });
  await page.waitForFunction(() => typeof allLeaveRecords !== 'undefined' && allLeaveRecords.length === 2, null, { timeout: 15000 });
  await page.evaluate(() => deleteLeaveAbsent(1));
  await page.waitForFunction(() => allLeaveRecords.length === 1);
  const c = calls.find((x) => x.action === 'deleteLeave');
  assert.deepEqual({ user: c.body.user, date: c.body.date, type: c.body.type, id: c.body.id, token: c.body.token },
    { user: 'trainer@x.com', date: '2026-11-05', type: 'Absent', id: 'L2', token: 'tok-123' });
  await context.close();
});

test('backend says {code:"session"} -> user is told and logged out to index.html', async () => {
  const { context, page, dialogs } = await openST({ onScript: (c) => (c.action === 'getLeaves' ? { success: false, code: 'session', message: 'Your session has expired. Please log in again.' } : undefined) });
  await page.waitForURL('**/index.html', { timeout: 15000 });
  assert.ok(dialogs.some((d) => d.includes('session has expired')));
  await page.waitForFunction(() => localStorage.getItem('portal_user') === null, null, { timeout: 5000 });
  await context.close();
});

test('logout: server is told to revoke the token, storage cleared, theme kept', async () => {
  const { context, page, calls } = await openST();
  await page.waitForFunction(() => window.PortalSession);
  await Promise.all([page.waitForURL('**/index.html'), page.evaluate(() => handleLogout())]);
  const c = calls.find((x) => x.action === 'logout');
  assert.ok(c, 'logout request was sent');
  assert.equal(c.query.token, 'tok-123');
  assert.equal(await page.evaluate(() => localStorage.getItem('portal_token')), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('portal_theme')), 'light');
  await context.close();
});

test('RTO page: approve call carries user + token', async () => {
  const context = await browser.newContext();
  await context.addInitScript(() => { localStorage.setItem('portal_user', 'rto@x.com'); localStorage.setItem('portal_name', 'RTO'); localStorage.setItem('portal_role', 'rto'); localStorage.setItem('portal_token', 'tok-rto'); });
  await setup(context);
  const page = await context.newPage();
  await page.goto(srv.url + '/RTO.html');
  await page.waitForFunction(() => window.PortalSession);
  assert.equal(await page.evaluate(() => PortalSession.authQuery()), '&user=rto%40x.com&token=tok-rto');
  await context.close();
});
