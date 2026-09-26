/**
 * @liafrik/control-sdk — Architecture Entry Point
 *
 * CONCEPTUAL MODULE — not published to npm.
 *
 * This module defines the architecture for a future SDK that applications
 * install to integrate with the Liafrik Command Center. It is structured so
 * it can be extracted into an independent package without rewriting.
 *
 * Target package structure:
 *   @liafrik/control-sdk/auth       — Registration, handshake, token management
 *   @liafrik/control-sdk/control    — Action execution, configuration sync
 *   @liafrik/control-sdk/events     — Event emission, subscription
 *   @liafrik/control-sdk/audit      — Audit log reporting
 *   @liafrik/control-sdk/health     — Health reporting, heartbeat
 *   @liafrik/control-sdk/webhooks   — Webhook sending, signature verification
 *   @liafrik/control-sdk/capabilities — Capability declaration
 */

export { register, handshake, getToken, revokeToken } from './auth';
export { executeAction, getConfiguration, updateConfiguration } from './control';
export { emit, subscribe } from './events';
export { reportHealth, startHeartbeat } from './health';
export { sendWebhook, verifySignature } from './webhooks';

export const SDK_VERSION = '0.1.0';
export const MIN_PROTOCOL_VERSION = 'v1';