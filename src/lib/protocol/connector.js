// Liafrik Control Protocol (LCP) connector abstraction.
// All remote calls are routed server-side — the browser never talks to an app's API with credentials.
// A future @liafrik/control-sdk implements the app side of these modules.
import { invokeFunction } from '@/lib/api';
import { base44 } from '@/api/base44Client';
import { capabilityMap } from './capabilities';

export const LCP_VERSION = 'v1';

export const LCP_MODULES = [
  { key: 'health', method: 'GET', path: '/health' },
  { key: 'heartbeat', method: 'POST', path: '/heartbeat' },
  { key: 'auth', method: 'POST', path: '/auth/session' },
  { key: 'users', method: 'GET', path: '/users' },
  { key: 'admins', method: 'GET', path: '/admins' },
  { key: 'roles', method: 'GET', path: '/roles' },
  { key: 'permissions', method: 'GET', path: '/permissions' },
  { key: 'metrics', method: 'GET', path: '/metrics' },
  { key: 'audit', method: 'POST', path: '/audit' },
  { key: 'notifications', method: 'POST', path: '/notifications' },
  { key: 'webhooks', method: 'POST', path: '/webhooks' },
  { key: 'settings', method: 'GET', path: '/settings' },
  { key: 'capabilities', method: 'GET', path: '/capabilities' },
  { key: 'diagnostics', method: 'GET', path: '/diagnostics' },
];

export function endpointFor(app, capability) {
  if (!app?.api_url) return null;
  const path = capabilityMap[capability]?.endpoint || `/${capability}`;
  return `${app.api_url.replace(/\/$/, '')}/lcp/${LCP_VERSION}${path}`;
}

// Live data requires a verified connection AND the server-side LCP proxy (next phase).
export const isLive = (app) => !app?.is_demo && app?.connection_status === 'connected';

// The application can be managed (actions executed) only when connected AND not in maintenance/read-only mode.
export const isManageable = (app) =>
  isLive(app) && app?.maintenance_mode === 'normal' && app?.lifecycle === 'active';

export const isInMaintenance = (app) => app?.maintenance_mode === 'maintenance' || app?.maintenance_mode === 'read_only';

export async function testConnection({ api_url, health_endpoint }) {
  const res = await invokeFunction('testConnection', { api_url, health_endpoint });
  return res.data;
}