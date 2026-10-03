// Application registry business logic. UI calls these; these call the data layer + audit.
import { Applications, Environments, Notifications, ChangeRecords } from '@/lib/data/repositories';
import { testConnection } from '@/lib/protocol/connector';
import { checkCompatibility, generateRegistrationTokenHint } from '@/lib/protocol/compatibility';
import { recordAudit } from './audit';
import { emit } from './eventBus';
import { invokeFunction } from '@/lib/api';

const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]));

export async function registerApplication(config, testResult) {
  // Secrets are never persisted in the browser-accessible registry — only a masked hint.
  const { api_key, webhook_secret, ...safe } = config;
  const passed = !!(testResult?.api?.reachable && testResult?.health?.ok);
  const tokenHint = generateRegistrationTokenHint();
  const app = await Applications.create({
    ...safe,
    credential_hint: api_key ? `••••${api_key.slice(-4)}` : undefined,
    registration_token_hint: tokenHint,
    registration_status: 'used',
    protocol_version: 'v1',
    connector_version: '1.0.0',
    compatibility_status: 'compatible',
    status: 'unknown',
    lifecycle: 'active',
    maintenance_mode: 'normal',
    connection_status: passed ? 'connected' : 'pending',
    is_demo: false,
  });
  await Environments.create({
    application_id: app.id,
    name: app.environment,
    url: app.domain ? `https://${app.domain}` : app.api_url,
    version: app.version,
    status: 'unknown',
    api_status: app.connection_status,
  });
  await recordAudit({
    action: 'application.registered',
    resource: 'application',
    resource_id: app.id,
    application: app,
    after: pick(app, ['name', 'slug', 'type', 'capabilities', 'protocol_version', 'connector_version']),
    risk_level: 'medium',
  });
  await Notifications.create({ title: app.name, body: 'Application registered in the Command Center.', severity: 'success', category: 'applications', application_id: app.id });
  return app;
}

export async function updateApplication(app, patch, action = 'application.updated') {
  if (app.locked && action !== 'application.unlocked') {
    throw new Error('Application is locked. Mutations are disabled.');
  }
  const updated = await Applications.update(app.id, patch);
  // Record changes for each changed field
  const changes = Object.keys(patch).filter((k) => JSON.stringify(patch[k]) !== JSON.stringify(app[k]));
  if (changes.length) {
    await ChangeRecords.bulkCreate(
      changes.map((field) => ({
        application_id: app.id,
        application_name: app.name,
        field,
        before: app[field] != null ? String(app[field]) : '',
        after: patch[field] != null ? String(patch[field]) : '',
        changed_by: 'system',
        section: 'settings',
        is_demo: app.is_demo || false,
      }))
    );
  }
  await recordAudit({ action, resource: 'application', resource_id: app.id, application: app, before: pick(app, Object.keys(patch)), after: patch, risk_level: 'medium' });
  return updated;
}

export const setLifecycle = (app, lifecycle) => updateApplication(app, { lifecycle }, `application.${lifecycle}`);

export async function setMaintenanceMode(app, mode) {
  const updated = await updateApplication(app, { maintenance_mode: mode }, 'application.maintenance_changed');
  await recordAudit({ action: 'application.maintenance_changed', resource: 'application', resource_id: app.id, application: app, before: { maintenance_mode: app.maintenance_mode }, after: { maintenance_mode: mode }, risk_level: 'high' });
  return updated;
}

export async function deleteApplication(app) {
  await Applications.remove(app.id);
  await recordAudit({ action: 'application.deleted', resource: 'application', resource_id: app.id, application: app, before: pick(app, ['name', 'slug']), risk_level: 'critical' });
}

function failureReason(result) {
  if (!result?.api?.reachable) return `API unreachable: ${result?.api?.error || 'connection failed'}`;
  if (!result?.health?.ok) {
    return result?.health?.reachable
      ? `Health check returned HTTP ${result.health.http_status}`
      : `Health check unreachable: ${result?.health?.error || 'connection failed'}`;
  }
  return 'Connection failed';
}

// Issues a real heartbeat token for this application (shown once). Backed by
// /api/generate-registration-token, which stores a verifiable hash, not just a hint.
export async function generateHeartbeatToken(app) {
  const res = await invokeFunction('generateRegistrationToken', { application_id: app.id });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

export async function runConnectionTest(app) {
  const result = await testConnection({ api_url: app.api_url, health_endpoint: app.health_endpoint });
  const ok = !!(result?.api?.reachable && result?.health?.ok);
  const now = new Date().toISOString();
  if (!app.is_demo) {
    await Applications.update(app.id, {
      connection_status: ok ? 'connected' : 'error',
      last_successful_connection: ok ? now : app.last_successful_connection,
      last_failed_connection: ok ? app.last_failed_connection : now,
      last_failed_reason: ok ? undefined : failureReason(result),
      response_ms: result?.api?.latency_ms,
    });
  }
  await recordAudit({
    action: 'application.connection_tested',
    resource: 'application',
    resource_id: app.id,
    application: app,
    outcome: ok ? 'success' : 'failure',
    risk_level: 'low',
  });
  if (!ok && !app.is_demo) {
    emit('application.offline', {
      application_id: app.id, application_name: app.name, message: failureReason(result),
      environment: app.environment, is_demo: false,
    }).catch(() => {});
  }
  return { ...result, ok };
}

export function getCompatibility(app) {
  return checkCompatibility(app);
}

export async function lockApplication(app, reason, actor = 'system') {
  const updated = await Applications.update(app.id, {
    locked: true,
    lock_reason: reason,
    locked_at: new Date().toISOString(),
    locked_by: actor,
  });
  await recordAudit({
    action: 'application.locked',
    resource: 'application',
    resource_id: app.id,
    application: app,
    before: { locked: false },
    after: { locked: true, reason, actor },
    risk_level: 'critical',
  });
  return updated;
}

export async function unlockApplication(app, actor = 'system') {
  const updated = await Applications.update(app.id, {
    locked: false,
    lock_reason: null,
    locked_at: null,
    locked_by: null,
  });
  await recordAudit({
    action: 'application.unlocked',
    resource: 'application',
    resource_id: app.id,
    application: app,
    before: { locked: true },
    after: { locked: false, actor },
    risk_level: 'high',
  });
  return updated;
}