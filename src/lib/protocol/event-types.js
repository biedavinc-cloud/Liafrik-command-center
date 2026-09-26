/**
 * Central Event Bus — Event Type Catalog
 *
 * Every event in the Command Center follows a dot-namespace convention:
 *   <entity>.<action>
 *
 * Events are emitted through the EventBus service and stored in ActivityEvent
 * with a formal event_type, severity, and correlation_id.
 *
 * The rule engine subscribes to these events to trigger automations.
 */

export const EVENT_CATALOG = {
  // Application lifecycle
  'application.created': { severity: 'medium', description: 'Application registered in the Command Center' },
  'application.connected': { severity: 'info', description: 'Application completed handshake' },
  'application.disconnected': { severity: 'high', description: 'Application lost connection' },
  'application.health_changed': { severity: 'high', description: 'Application health status changed' },
  'application.locked': { severity: 'critical', description: 'Application was locked by SuperAdmin' },
  'application.unlocked': { severity: 'medium', description: 'Application lock was released' },
  'application.maintenance_enabled': { severity: 'high', description: 'Maintenance mode enabled' },
  'application.maintenance_disabled': { severity: 'medium', description: 'Maintenance mode disabled' },
  'application.deleted': { severity: 'critical', description: 'Application removed from registry' },
  'application.config_changed': { severity: 'medium', description: 'Application configuration modified' },

  // User / Administrator
  'user.created': { severity: 'info', description: 'User created in an application' },
  'user.updated': { severity: 'info', description: 'User updated in an application' },
  'user.deleted': { severity: 'medium', description: 'User deleted from an application' },
  'admin.created': { severity: 'medium', description: 'Administrator created' },
  'admin.permission_changed': { severity: 'high', description: 'Administrator permissions changed' },
  'admin.suspended': { severity: 'high', description: 'Administrator suspended' },

  // Security
  'security.login_failed': { severity: 'medium', description: 'Failed login attempt' },
  'security.api_key_created': { severity: 'medium', description: 'API key created' },
  'security.api_key_rotated': { severity: 'high', description: 'API key rotated' },
  'security.api_key_revoked': { severity: 'high', description: 'API key revoked' },
  'security.session_revoked': { severity: 'high', description: 'Session revoked' },
  'security.suspicious_api': { severity: 'high', description: 'Suspicious API activity detected' },
  'security.safe_mode_enabled': { severity: 'critical', description: 'Safe Mode activated' },
  'security.safe_mode_disabled': { severity: 'critical', description: 'Safe Mode deactivated' },

  // Deployment
  'deployment.started': { severity: 'medium', description: 'Deployment started' },
  'deployment.completed': { severity: 'info', description: 'Deployment completed successfully' },
  'deployment.failed': { severity: 'high', description: 'Deployment failed' },

  // Webhook
  'webhook.sent': { severity: 'info', description: 'Webhook delivered' },
  'webhook.failed': { severity: 'high', description: 'Webhook delivery failed' },
  'webhook.retried': { severity: 'medium', description: 'Webhook retry attempted' },

  // Incident
  'incident.created': { severity: 'high', description: 'Incident created' },
  'incident.acknowledged': { severity: 'medium', description: 'Incident acknowledged' },
  'incident.resolved': { severity: 'info', description: 'Incident resolved' },

  // System
  'system.rule_fired': { severity: 'medium', description: 'Automation rule fired' },
  'system.config_changed': { severity: 'medium', description: 'System configuration changed' },
};

export function isKnownEvent(type) {
  return type in EVENT_CATALOG;
}

export function eventSeverity(type) {
  return EVENT_CATALOG[type]?.severity || 'info';
}

export function eventDescription(type) {
  return EVENT_CATALOG[type]?.description || type;
}