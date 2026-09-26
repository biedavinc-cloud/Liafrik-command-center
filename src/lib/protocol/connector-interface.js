/**
 * Application Connector Interface — Formal Abstraction
 *
 * Defines the contract that every application connector must implement.
 * Not every connector supports every operation — unsupported operations return
 * a controlled { status: 'unsupported' } result rather than throwing.
 *
 * This is a conceptual interface (JS does not have interfaces). Future SDK
 * implementations (@liafrik/control-sdk) will conform to this contract.
 *
 * Connector lifecycle:
 *   register → connect → handshake → discover → operate → disconnect
 */

export const CONNECTOR_OPS = [
  'connect',
  'disconnect',
  'testConnection',
  'getMetadata',
  'getCapabilities',
  'getHealth',
  'getVersion',
  'getUsers',
  'getAdministrators',
  'getAnalytics',
  'getAuditLogs',
  'getNotifications',
  'getSettings',
  'executeAction',
  'getConfiguration',
  'updateConfiguration',
];

/**
 * Base connector — all connectors extend this.
 * Each operation returns a Promise<ConnectorResult>.
 */
export class ApplicationConnector {
  constructor(app, credentials) {
    this.app = app;
    this.credentials = credentials;
    this.state = 'disconnected';
  }

  // Override in subclasses
  async connect() { return unsupported('connect'); }
  async disconnect() { this.state = 'disconnected'; return ok({}); }
  async testConnection() { return unsupported('testConnection'); }
  async getMetadata() { return unsupported('getMetadata'); }
  async getCapabilities() { return unsupported('getCapabilities'); }
  async getHealth() { return unsupported('getHealth'); }
  async getVersion() { return unsupported('getVersion'); }
  async getUsers() { return unsupported('getUsers'); }
  async getAdministrators() { return unsupported('getAdministrators'); }
  async getAnalytics() { return unsupported('getAnalytics'); }
  async getAuditLogs() { return unsupported('getAuditLogs'); }
  async getNotifications() { return unsupported('getNotifications'); }
  async getSettings() { return unsupported('getSettings'); }
  async executeAction(action, payload, correlationId) { return unsupported('executeAction'); }
  async getConfiguration() { return unsupported('getConfiguration'); }
  async updateConfiguration(config) { return unsupported('updateConfiguration'); }
}

// Result helpers — every connector operation returns one of these shapes
export function ok(data) {
  return { status: 'ok', data, correlation_id: null };
}

export function unsupported(op) {
  return { status: 'unsupported', operation: op, data: null };
}

export function error(message, details = null) {
  return { status: 'error', message, details, data: null };
}

/**
 * Connector registry — maps auth_method → connector class.
 * New connector types register here. The Command Center picks the right
 * connector based on the application's auth_method field.
 */
export const connectorRegistry = new Map();

export function registerConnector(authMethod, ConnectorClass) {
  connectorRegistry.set(authMethod, ConnectorClass);
}

export function getConnector(app, credentials) {
  const ConnectorClass = connectorRegistry.get(app?.auth_method || 'api_key');
  if (!ConnectorClass) return null;
  return new ConnectorClass(app, credentials);
}

/**
 * Check whether a connector supports a given operation.
 */
export function supportsOp(connector, op) {
  return connector && typeof connector[op] === 'function' && connector[op] !== ApplicationConnector.prototype[op];
}