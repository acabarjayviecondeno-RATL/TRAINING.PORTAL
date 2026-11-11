// Day 4/5: runs apps-script-role-guard.gs in a Node VM with fake Apps Script services.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

function load() {
  const cache = new Map(); const props = {}; let epoch = '1'; const logs = [];
  const ctx = {
    Logger: { log: (m) => logs.push(m) },
    CacheService: { getScriptCache: () => ({ put: (k, v) => cache.set(k, v), get: (k) => (cache.has(k) ? cache.get(k) : null), remove: (k) => cache.delete(k) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = v; } }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      getUuid: () => crypto.randomUUID(),
      computeDigest: (alg, s) => Array.from(crypto.createHash('sha256').update(String(s)).digest()).map((b) => (b > 127 ? b - 256 : b)),
    },
    getSessionEpoch_: () => epoch,
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../backend/apps-script-role-guard.gs'), 'utf8'), ctx);
  return { ctx, logs, setEpoch: (e) => { epoch = e; }, cache };
}

test('soft mode (default): missing token is logged but allowed', () => {
  const { ctx, logs } = load();
  assert.equal(ctx.guardSubmitLeave_({ action: 'saveLeave', user: 'a@x.com' }), null);
  assert.equal(ctx.guardDecideApproval_({ user: 'a@x.com' }), null);
  assert.ok(logs.some((l) => l.includes('[ROLE_GUARD soft]')));
});

test('enforced: no token / unknown token is refused with code "session"', () => {
  const { ctx } = load(); ctx.enableRoleGuard();
  const r = ctx.guardSubmitLeave_({ user: 'a@x.com' });
  assert.equal(r.success, false); assert.equal(r.code, 'session');
  assert.equal(ctx.guardSubmitLeave_({ user: 'a@x.com', token: 'nope' }).code, 'session');
});

test('enforced: owner with a valid token may submit leave; someone else may not', () => {
  const { ctx } = load(); ctx.enableRoleGuard();
  const t = ctx.issueSession_('Trainer@X.com', 'ST');
  assert.equal(ctx.guardSubmitLeave_({ user: 'trainer@x.com', token: t }), null);
  assert.equal(ctx.guardSubmitLeave_({ nsUserId: 'trainer@x.com', token: t }), null);   // alt field names used by the backend
  assert.equal(ctx.guardSubmitLeave_({ user: 'other@x.com', token: t }).reason, 'user-mismatch');
  assert.equal(ctx.guardSubmitLeave_({ token: t }).reason, 'user-mismatch');              // empty user
});

test('enforced: only RTO / SEPCO / ADMIN may decide approvals', () => {
  const { ctx } = load(); ctx.enableRoleGuard();
  const st = ctx.issueSession_('st@x.com', 'ST');
  assert.equal(ctx.guardDecideApproval_({ user: 'st@x.com', token: st }).reason, 'role');
  for (const role of ['RTO', 'Regional Training Officer', 'SEPCO', 'SEPCO Admin', 'Admin']) {
    const t = ctx.issueSession_('boss@x.com', role);
    assert.equal(ctx.guardDecideApproval_({ user: 'boss@x.com', token: t }), null, role);
  }
});

test('revoked token and "Force logout all" (epoch bump) both invalidate the session', () => {
  const { ctx, setEpoch } = load(); ctx.enableRoleGuard();
  const a = ctx.issueSession_('a@x.com', 'ST'); const b = ctx.issueSession_('a@x.com', 'ST');
  assert.equal(ctx.guardSubmitLeave_({ user: 'a@x.com', token: a }), null);
  ctx.revokeSession_(a);
  assert.equal(ctx.guardSubmitLeave_({ user: 'a@x.com', token: a }).code, 'session');
  assert.equal(ctx.guardSubmitLeave_({ user: 'a@x.com', token: b }), null);
  setEpoch('2');
  assert.equal(ctx.guardSubmitLeave_({ user: 'a@x.com', token: b }).code, 'session');
});

test('only the SHA-256 of the token is stored, never the token itself', () => {
  const { ctx, cache } = load();
  const t = ctx.issueSession_('a@x.com', 'ST');
  for (const k of cache.keys()) assert.ok(!k.includes(t));
  assert.equal(cache.size, 1);
});

test('disableRoleGuard returns to soft mode', () => {
  const { ctx } = load(); ctx.enableRoleGuard(); ctx.disableRoleGuard();
  assert.equal(ctx.guardSubmitLeave_({ user: 'a@x.com' }), null);
});
