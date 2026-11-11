// Thin fetch wrapper for the Apps Script Web App. Same request shapes the pages used inline:
//  - GET  ?action=...&k=v
//  - POST body = JSON string, Content-Type text/plain (avoids the CORS preflight Apps Script cannot answer)
import { WEB_APP_URL } from '../config.js';
import { authParams, expired } from '../session.js';

function handle(json) {
  if (json && json.code === 'session') expired(json.message);
  return json;
}

export async function getJson(action, params, init) {
  const qs = new URLSearchParams(Object.assign({ action }, params || {}, authParams()));
  const res = await fetch(WEB_APP_URL + '?' + qs.toString(), init);
  return handle(await res.json());
}

export async function postJson(body) {
  const res = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(Object.assign({}, body, authParams())),
  });
  return handle(await res.json());
}
