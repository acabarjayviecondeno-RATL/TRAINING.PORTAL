// Loaded by every portal page as <script type="module">. Exposes window.PortalSession / window.PortalApi
// for the pages' existing classic inline scripts (which call them from event handlers / window.onload).
import './session.js';
import { PortalApi } from './api/index.js';
window.PortalApi = PortalApi;
