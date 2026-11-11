// Fakes everything outside the project: CDN libraries and the Apps Script backend (no live data is touched).
const STUBS = {
  tailwind: 'window.tailwind={};',
  lucide: 'window.lucide={createIcons(){}};',
  xlsx: 'window.XLSX={utils:{},writeFile(){}};',
  papa: 'window.Papa={parse(){return{data:[],errors:[],meta:{}}}};',
  chart: 'window.Chart=function(){return{destroy(){},update(){},resize(){},data:{datasets:[]},options:{}}};Chart.defaults={font:{},plugins:{title:{font:{}},legend:{labels:{}}}};Chart.register=function(){};Chart.instances={};',
};

async function setup(context, { leaves = [], onScript } = {}) {
  const calls = [];
  await context.route('**/*', async (route) => {
    const u = route.request().url();
    if (u.startsWith('http://127.0.0.1')) return route.continue();
    if (u.includes('tailwindcss')) return route.fulfill({ contentType: 'text/javascript', body: STUBS.tailwind });
    if (u.includes('lucide')) return route.fulfill({ contentType: 'text/javascript', body: STUBS.lucide });
    if (u.includes('xlsx')) return route.fulfill({ contentType: 'text/javascript', body: STUBS.xlsx });
    if (u.includes('PapaParse')) return route.fulfill({ contentType: 'text/javascript', body: STUBS.papa });
    if (u.includes('chart.js')) return route.fulfill({ contentType: 'text/javascript', body: STUBS.chart });
    if (u.startsWith('https://script.google.com/')) {
      const req = route.request();
      const url = new URL(u);
      let body = {}; try { body = JSON.parse(req.postData() || '{}'); } catch (e) {}
      const action = url.searchParams.get('action') || body.action || '';
      const call = { method: req.method(), action, query: Object.fromEntries(url.searchParams), body };
      calls.push(call);
      let out = onScript && onScript(call);
      if (out === undefined) {
        out = { success: false, message: 'mock: ' + action };
        if (action === 'getLeaves') out = { success: true, leaves };
        else if (action === 'getLeaveSettings') out = { success: true, allowEditApproved: false };
        else if (action === 'checkSession') out = { success: true, epoch: 1 };
        else if (action === 'getApproversByPosition') out = { success: true, approvers: [{ email: 'rto@x.com', name: 'RTO One', position: 'RTO' }] };
        else if (action === 'saveLeave') out = { success: true, id: 'Lnew', status: 'Pending' };
        else if (action === 'deleteLeave' || action === 'logout') out = { success: true };
      }
      return route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(out) });
    }
    return route.fulfill({ status: 200, contentType: 'text/plain', body: '' });   // fonts, google sheets csv, etc.
  });
  return calls;
}

const ST_LOGIN = { portal_user: 'trainer@x.com', portal_name: 'Trainer', portal_role: 'st', portal_jobgroup: 'Content Developer', portal_token: 'tok-123', portal_theme: 'light' };
module.exports = { setup, ST_LOGIN };
