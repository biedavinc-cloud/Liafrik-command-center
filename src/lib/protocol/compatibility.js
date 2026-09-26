// Control Protocol versioning and compatibility.
// The Command Center requires a specific protocol version; each application declares
// what it supports. This module computes compatibility and lists missing capabilities.

export const REQUIRED_PROTOCOL_VERSION = 'v1';
export const REQUIRED_CONNECTOR_VERSION = '1.0.0';

export const PROTOCOL_VERSIONS = [
  { version: 'v1', status: 'current', description: 'Initial Control Protocol' },
  { version: 'v2', status: 'planned', description: 'Planned — may not be backward compatible' },
  { version: 'v3', status: 'planned', description: 'Future' },
];

// Compare two semver-like version strings (v1, 1.0.0, etc.)
export function compareVersions(a, b) {
  const norm = (v) => (v || '').replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const [a1 = 0, a2 = 0, a3 = 0] = norm(a);
  const [b1 = 0, b2 = 0, b3 = 0] = norm(b);
  return a1 - b1 || a2 - b2 || a3 - b3;
}

// Check if an application is compatible with the Command Center's required protocol.
export function checkCompatibility(app) {
  if (!app) return { status: 'unknown', missing: [] };

  const protocolOk = app.protocol_version === REQUIRED_PROTOCOL_VERSION;
  const connectorOk = compareVersions(app.connector_version, REQUIRED_CONNECTOR_VERSION) >= 0;

  // Required capabilities that every LCP-compatible app must declare
  const requiredCaps = ['health'];
  const declared = app.capabilities || [];
  const missingCaps = requiredCaps.filter((c) => !declared.includes(c));

  if (protocolOk && connectorOk && missingCaps.length === 0) {
    return { status: 'compatible', missing: [] };
  }

  const missing = [];
  if (!protocolOk) missing.push({ type: 'protocol', required: REQUIRED_PROTOCOL_VERSION, installed: app.protocol_version });
  if (!connectorOk) missing.push({ type: 'connector', required: REQUIRED_CONNECTOR_VERSION, installed: app.connector_version });
  if (missingCaps.length) missing.push({ type: 'capabilities', required: requiredCaps, missing: missingCaps });

  return { status: 'incompatible', missing };
}

// Registration token lifecycle
export const REGISTRATION_STATUS = {
  active: 'active',       // token issued, not yet used
  used: 'used',            // application registered successfully
  expired: 'expired',      // token expired before use
  revoked: 'revoked',       // token revoked by admin
};

// Generate a one-time registration token hint (the full token is server-side only)
export function generateRegistrationTokenHint() {
  const hex = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `LCP-••••${hex}`;
}