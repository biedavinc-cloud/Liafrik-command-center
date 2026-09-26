/**
 * Liafrik Control Protocol (LCP) — Formal Specification
 *
 * The LCP defines the contract between the Command Center and any managed application.
 * Applications implement these endpoints to become manageable. The Command Center
 * discovers capabilities, monitors health, and executes actions through this protocol.
 *
 * Versioning:
 *   v1    — Initial protocol (current)
 *   v1.1  — Adds /capabilities discovery + /metadata (planned)
 *   v2    — Adds streaming events + bidirectional control (future)
 *
 * Connection states (never fake these):
 *   implemented  — endpoint exists and returned valid data
 *   configured   — endpoint URL is set but not yet verified
 *   pending      — application registered, handshake not started
 *   connected    — handshake completed, health passing
 *   error        — endpoint returned an error
 *   unsupported  — application declared this capability is not available
 *   mock         — simulated for demo purposes (clearly labeled)
 */

export const LCP_VERSIONS = {
  v1: {
    version: 'v1',
    status: 'current',
    endpoints: ['/health', '/version', '/capabilities', '/metadata', '/actions', '/webhooks'],
    minConnector: '1.0.0',
  },
  'v1.1': {
    version: 'v1.1',
    status: 'planned',
    endpoints: ['/health', '/version', '/capabilities', '/metadata', '/actions', '/webhooks', '/users', '/administrators', '/analytics', '/audit', '/notifications', '/settings'],
    minConnector: '1.1.0',
  },
  v2: {
    version: 'v2',
    status: 'future',
    endpoints: ['/health', '/version', '/capabilities', '/metadata', '/actions', '/webhooks', '/users', '/administrators', '/analytics', '/audit', '/notifications', '/settings', '/events/stream', '/config'],
    minConnector: '2.0.0',
  },
};

export const CURRENT_LCP_VERSION = 'v1';
export const MIN_CONNECTOR_VERSION = '1.0.0';

/**
 * Standard LCP endpoint contracts.
 * Each contract defines: method, path, auth required, expected response shape.
 * Applications conform to these contracts; the Command Center does not adapt per-app.
 */
export const LCP_ENDPOINTS = {
  health: {
    method: 'GET',
    path: '/health',
    auth: false,
    description: 'Returns application health status',
    response: { status: 'online|degraded|offline', uptime: 'number', version: 'string' },
    capability: null,
  },
  version: {
    method: 'GET',
    path: '/version',
    auth: true,
    description: 'Returns application and protocol version info',
    response: { app_version: 'string', protocol_version: 'string', connector_version: 'string' },
    capability: null,
  },
  capabilities: {
    method: 'GET',
    path: '/capabilities',
    auth: true,
    description: 'Declares which modules the application supports',
    response: { capabilities: 'string[]', protocol_version: 'string' },
    capability: null,
  },
  metadata: {
    method: 'GET',
    path: '/metadata',
    auth: true,
    description: 'Returns application metadata (name, type, domain)',
    response: { name: 'string', type: 'string', domain: 'string', environment: 'string' },
    capability: null,
  },
  users: {
    method: 'GET',
    path: '/users',
    auth: true,
    description: 'Lists application users (paginated)',
    response: { users: 'array', total: 'number', page: 'number' },
    capability: 'users',
  },
  administrators: {
    method: 'GET',
    path: '/administrators',
    auth: true,
    description: 'Lists application administrators',
    response: { administrators: 'array' },
    capability: 'administrators',
  },
  analytics: {
    method: 'GET',
    path: '/analytics',
    auth: true,
    description: 'Returns application analytics metrics',
    response: { metrics: 'object', period: 'string' },
    capability: 'analytics',
  },
  audit: {
    method: 'GET',
    path: '/audit',
    auth: true,
    description: 'Returns application audit log entries',
    response: { entries: 'array', total: 'number' },
    capability: 'audit_logs',
  },
  notifications: {
    method: 'GET',
    path: '/notifications',
    auth: true,
    description: 'Returns application notifications',
    response: { notifications: 'array' },
    capability: 'notifications',
  },
  settings: {
    method: 'GET',
    path: '/settings',
    auth: true,
    description: 'Returns application configuration',
    response: { settings: 'object' },
    capability: 'settings',
  },
  actions: {
    method: 'POST',
    path: '/actions',
    auth: true,
    description: 'Executes a remote action on the application',
    body: { action: 'string', payload: 'object', correlation_id: 'string' },
    response: { accepted: 'boolean', action_id: 'string' },
    capability: null,
  },
  webhooks: {
    method: 'POST',
    path: '/webhooks',
    auth: true,
    description: 'Registers a webhook subscription',
    body: { event: 'string', endpoint: 'string' },
    response: { subscribed: 'boolean' },
    capability: 'webhooks',
  },
};

/**
 * Determine if an endpoint is available for a given application.
 * Returns one of: implemented, configured, pending, error, unsupported, mock
 */
export function endpointState(app, endpointKey) {
  const contract = LCP_ENDPOINTS[endpointKey];
  if (!contract) return 'unsupported';
  if (contract.capability && !(app?.capabilities || []).includes(contract.capability)) return 'unsupported';
  if (app?.is_demo) return 'mock';
  if (app?.connection_status === 'connected') return 'implemented';
  if (app?.connection_status === 'configured') return 'configured';
  if (app?.connection_status === 'error') return 'error';
  return 'pending';
}

export const LCP_STATE_LABELS = {
  implemented: { label: 'Implemented', tone: 'emerald' },
  configured: { label: 'Configured', tone: 'amber' },
  pending: { label: 'Pending', tone: 'slate' },
  connected: { label: 'Connected', tone: 'emerald' },
  error: { label: 'Error', tone: 'rose' },
  unsupported: { label: 'Unsupported', tone: 'slate' },
  mock: { label: 'Mock', tone: 'violet' },
};