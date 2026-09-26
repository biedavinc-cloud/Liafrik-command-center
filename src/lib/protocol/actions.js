// Remote action model — the standardized contract for every privileged action
// the Command Center can execute against a connected application.
// The browser NEVER executes these directly; they are routed through the LCP gateway server-side.
// Each action declares its risk level; HIGH and CRITICAL require explicit confirmation.

export const RISK_LEVELS = {
  low: { requiresConfirmation: false, color: 'emerald' },
  medium: { requiresConfirmation: false, color: 'sky' },
  high: { requiresConfirmation: true, color: 'amber' },
  critical: { requiresConfirmation: true, color: 'rose' },
};

// Action registry — keyed by `${capability}.${verb}`.
// The UI uses this to show action buttons with the right risk level and confirmation requirement.
// The LCP gateway will use this to route the request to the correct endpoint.
export const ACTION_REGISTRY = {
  'users.view': { risk: 'low', method: 'GET', path: '/users', requiresCapability: 'users' },
  'users.suspend': { risk: 'high', method: 'POST', path: '/users/{id}/suspend', requiresCapability: 'users' },
  'users.activate': { risk: 'medium', method: 'POST', path: '/users/{id}/activate', requiresCapability: 'users' },
  'users.delete': { risk: 'critical', method: 'DELETE', path: '/users/{id}', requiresCapability: 'users' },

  'sellers.view': { risk: 'low', method: 'GET', path: '/sellers', requiresCapability: 'sellers' },
  'sellers.suspend': { risk: 'high', method: 'POST', path: '/sellers/{id}/suspend', requiresCapability: 'sellers' },
  'sellers.activate': { risk: 'medium', method: 'POST', path: '/sellers/{id}/activate', requiresCapability: 'sellers' },
  'sellers.delete': { risk: 'critical', method: 'DELETE', path: '/sellers/{id}', requiresCapability: 'sellers' },

  'orders.view': { risk: 'low', method: 'GET', path: '/orders', requiresCapability: 'orders' },
  'orders.cancel': { risk: 'high', method: 'POST', path: '/orders/{id}/cancel', requiresCapability: 'orders' },

  'payments.view': { risk: 'low', method: 'GET', path: '/payments', requiresCapability: 'payments' },
  'payments.refund': { risk: 'critical', method: 'POST', path: '/payments/{id}/refund', requiresCapability: 'payments' },

  'products.view': { risk: 'low', method: 'GET', path: '/products', requiresCapability: 'products' },
  'products.create': { risk: 'medium', method: 'POST', path: '/products', requiresCapability: 'products' },
  'products.update': { risk: 'medium', method: 'PUT', path: '/products/{id}', requiresCapability: 'products' },
  'products.delete': { risk: 'high', method: 'DELETE', path: '/products/{id}', requiresCapability: 'products' },

  'administrators.view': { risk: 'low', method: 'GET', path: '/admins', requiresCapability: 'administrators' },
  'administrators.suspend': { risk: 'high', method: 'POST', path: '/admins/{id}/suspend', requiresCapability: 'administrators' },
  'administrators.delete': { risk: 'critical', method: 'DELETE', path: '/admins/{id}', requiresCapability: 'administrators' },

  'settings.view': { risk: 'low', method: 'GET', path: '/settings', requiresCapability: 'settings' },
  'settings.update': { risk: 'high', method: 'PUT', path: '/settings', requiresCapability: 'settings' },
};

export function getAction(key) {
  return ACTION_REGISTRY[key];
}

export function actionsForCapability(capability) {
  return Object.entries(ACTION_REGISTRY)
    .filter(([k]) => k.startsWith(`${capability}.`))
    .map(([key, spec]) => ({ key, ...spec }));
}

export function requiresConfirmation(actionKey) {
  const action = ACTION_REGISTRY[actionKey];
  return action ? RISK_LEVELS[action.risk].requiresConfirmation : false;
}

// Generate a correlation ID for cross-system action tracing.
// Format: CMD-XXXXXXXX (8 hex chars).
export function generateCorrelationId() {
  const hex = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `CMD-${hex}`;
}