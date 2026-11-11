// Day 3: one place for the login session (token, auth params, logout, auto-logout on expired session).
// The pages' existing early auth guards (role checks in <head>) stay as they are; this adds the server-issued token.
import { WEB_APP_URL } from './config.js';

const TOKEN_KEY = 'portal_token';

function ls() { try { return window.localStorage; } catch (e) { return null; } }

export function getToken() { const s = ls(); try { return (s && s.getItem(TOKEN_KEY)) || ''; } catch (e) { return ''; } }
export function setToken(t) { const s = ls(); try { if (s) { if (t) s.setItem(TOKEN_KEY, t); else s.removeItem(TOKEN_KEY); } } catch (e) {} }
export function getUser() { const s = ls(); try { return String((s && s.getItem('portal_user')) || '').toLowerCase().trim(); } catch (e) { return ''; } }

/** {token} when logged in with a server session, otherwise {} (old sessions keep working while the backend guard is in soft mode). */
export function authParams() { const t = getToken(); return t ? { token: t } : {}; }
/** "&user=..&token=.." for GET urls built by hand (RTO / SEPCO / Admin approval calls). */
export function authQuery() {
  const t = getToken();
  return t ? '&user=' + encodeURIComponent(getUser()) + '&token=' + encodeURIComponent(t) : '';
}

/** Tell the server to forget this token (fire-and-forget; never blocks logout). */
export function revoke() {
  const t = getToken();
  if (!t) return;
  try { fetch(WEB_APP_URL + '?action=logout&token=' + encodeURIComponent(t), { keepalive: true }).catch(() => {}); } catch (e) {}
}

/**
 * Logout used by every page's handleLogout().
 * keepKeys / keepPrefixes: localStorage entries that survive (theme, dismissed notifications).
 * clearSession / clearCookies: extra wipes the RTO / SEPCO pages already did.
 */
export function logout(opts) {
  const o = Object.assign({ keepKeys: ['portal_theme'], keepPrefixes: [], clearSession: false, clearCookies: false, replace: false, redirect: 'index.html' }, opts || {});
  revoke();
  const keep = {};
  const s = ls();
  try {
    if (s) {
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i);
        if (k && (o.keepKeys.indexOf(k) !== -1 || o.keepPrefixes.some((p) => k.indexOf(p) === 0))) keep[k] = s.getItem(k);
      }
      s.clear();
      Object.keys(keep).forEach((k) => s.setItem(k, keep[k]));
    }
  } catch (e) {}
  if (o.clearSession) { try { window.sessionStorage.clear(); } catch (e) {} }
  if (o.clearCookies) {
    try {
      document.cookie.split(';').forEach((c) => { document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/'); });
    } catch (e) {}
  }
  if (o.replace) window.location.replace(o.redirect); else window.location.href = o.redirect;
}

/** Called by the API layer when the backend answers {code:"session"} (token missing / expired / revoked). */
let expiring = false;
export function expired(message) {
  if (expiring) return;
  expiring = true;
  try { window.alert(message || 'Your session has expired. Please log in again.'); } catch (e) {}
  logout({ keepKeys: ['portal_theme'], keepPrefixes: ['portal_dismissed_notifs_'], replace: true });
}

export const PortalSession = { getToken, setToken, getUser, authParams, authQuery, revoke, logout, expired };
if (typeof window !== 'undefined') window.PortalSession = PortalSession;
