// The Apps Script files cannot run here, but they must at least parse (a syntax error = the whole web app is down).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
for (const f of ['app_sript.txt', 'apps-script-role-guard.gs', 'SFT_appscript.txt', 'worker.txt']) {
  test('parses: backend/' + f, () => {
    let src = fs.readFileSync(path.join(__dirname, '../../backend', f), 'utf8');
    if (f === 'worker.txt') src = src.replace(/export default/, 'var __w =');   // ES module worker -> plain script for the parse check
    assert.doesNotThrow(() => new vm.Script(src, { filename: f }));
  });
}
