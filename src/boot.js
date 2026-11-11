// Loaded by every portal page as <script type="module">. Exposes window.PortalSession / window.PortalApi
// for the pages' existing classic inline scripts (which call them from event handlers / window.onload).
import './session.js';
import { PortalApi } from './api/index.js';
window.PortalApi = PortalApi;

// Itago ang ".html" sa address bar (gumagana ang URL kahit i-refresh)
try {
  if (location.pathname.endsWith('.html')) {
    const clean = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    history.replaceState(null, '', clean + location.search + location.hash);
  }
} catch (e) {
  console.warn('clean-url failed', e);
}